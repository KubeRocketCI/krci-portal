import {
  DEFECTDOJO_SEVERITIES,
  NO_FINDING_COUNTS,
  compareOverviewNamespaces,
  type DefectDojoSeverity,
  type OverviewNamespace,
  type SecurityOverview,
  type SecurityOverviewRequest,
  type SeverityCounts,
} from "@my-project/shared";
import { dataOf, type DefectDojoProduct, type DefectDojoResult } from "../../../clients/defectDojo/index.js";
import { TAG_KEY, formatTag, tagValue } from "../codebaseFindings/tags.js";
import type { PlatformFacts } from "../platformFindings/facts.js";
import { SECRET_LIST, openRows, readMostSevere } from "../platformFindings/list.js";
import {
  NAMESPACE_PRODUCT_TAG_TEXT,
  findingsScopeOf,
  namespaceOf,
  placeKey,
  type Place,
} from "../platformFindings/scope.js";
import { createOverviewCache } from "./cache.js";
import { countEach, type SecurityOverviewSource } from "./source.js";

/** A namespace product with the findings of the state, the exposed secrets apart. */
export interface NamespaceProductCounts {
  product: DefectDojoProduct;
  /** The cluster and namespace its tags name. */
  place: Place;
  vulnerabilities: SeverityCounts;
  secrets: SeverityCounts;
}

/** What the Runtime part reads from DefectDojo. The same for every caller: no Kubernetes value is in it. */
export interface RuntimePart {
  namespaceProducts: NamespaceProductCounts[];
  secretsTruncated: boolean;
}

interface SecretCounts {
  /** Every secret of the state by namespace product: what its count holds besides the vulnerabilities. */
  all: Map<number, SeverityCounts>;
  /** The secrets of open tests only, as the Exposed Secrets list shows them. */
  open: Map<number, SeverityCounts>;
  truncated: boolean;
}

function withoutSecrets(counts: Readonly<SeverityCounts>, secrets: Readonly<SeverityCounts>): SeverityCounts {
  const vulnerabilities = { ...NO_FINDING_COUNTS };
  for (const severity of DEFECTDOJO_SEVERITIES) {
    vulnerabilities[severity] = Math.max(0, counts[severity] - secrets[severity]);
  }
  return vulnerabilities;
}

function addFinding(byProduct: Map<number, SeverityCounts>, productId: number, severity: DefectDojoSeverity): void {
  const counts = byProduct.get(productId) ?? { ...NO_FINDING_COUNTS };
  counts[severity] += 1;
  byProduct.set(productId, counts);
}

/**
 * The exposed-secret findings of the state by namespace product. A close mitigates the findings of a test, but the
 * flags of a triaged finding outlive it: its count holds them, while the lists leave closed tests out.
 */
async function readSecretCounts(
  source: SecurityOverviewSource,
  state: SecurityOverviewRequest["state"]
): Promise<SecretCounts> {
  const read = dataOf(
    await readMostSevere(source, {
      scope: { testTags: { all: [formatTag(TAG_KEY.reportKind, SECRET_LIST.reportKind)] } },
      scanTypes: [],
      withTests: true,
      state,
    })
  );

  const all = new Map<number, SeverityCounts>();
  const open = new Map<number, SeverityCounts>();
  for (const page of read?.pages ?? []) {
    page.findings.forEach((finding) => addFinding(all, finding.product.id, finding.severity));
    openRows(page).forEach(({ finding }) => addFinding(open, finding.product.id, finding.severity));
  }
  return { all, open, truncated: read?.truncated ?? false };
}

async function readRuntimePart(
  source: SecurityOverviewSource,
  state: SecurityOverviewRequest["state"]
): Promise<DefectDojoResult<RuntimePart>> {
  const products = dataOf(await source.listProductsWithTagText(NAMESPACE_PRODUCT_TAG_TEXT)) ?? [];
  const namespaceProducts = products.flatMap((product) => {
    const place = namespaceOf(product);
    return place ? [{ product, place }] : [];
  });
  if (namespaceProducts.length === 0) {
    return { state: "noScanData" };
  }

  const [counts, secrets] = await Promise.all([
    countEach(
      source,
      namespaceProducts.map(({ product }) => ({ productIds: [product.id] })),
      { state }
    ),
    readSecretCounts(source, state),
  ]);

  return {
    state: "data",
    data: {
      namespaceProducts: namespaceProducts.map(({ product, place }, index) => ({
        product,
        place,
        vulnerabilities: withoutSecrets(counts[index], secrets.all.get(product.id) ?? NO_FINDING_COUNTS),
        secrets: secrets.open.get(product.id) ?? { ...NO_FINDING_COUNTS },
      })),
      secretsTruncated: secrets.truncated,
    },
  };
}

const runtimeCache = createOverviewCache<RuntimePart>();

export function loadRuntimePart(
  source: SecurityOverviewSource,
  state: SecurityOverviewRequest["state"]
): Promise<DefectDojoResult<RuntimePart>> {
  return runtimeCache.read(`${source.cacheScope}\n${state}`, () => readRuntimePart(source, state));
}

/** The namespaces of the scope with the counts of their namespace products, for the caller's Stages. */
export function toSecurityOverview(
  facts: Pick<PlatformFacts, "stages">,
  part: DefectDojoResult<RuntimePart>,
  installationNamespace: string
): SecurityOverview {
  if (part.state !== "data") {
    return part;
  }
  const { namespaceProducts, secretsTruncated } = part.data;
  const scope = findingsScopeOf(
    facts,
    namespaceProducts.map(({ place }) => place)
  );
  const byPlace = new Map(namespaceProducts.map((entry) => [placeKey(entry.place), entry]));
  const namespaces = scope.namespaces
    .map((option): OverviewNamespace => {
      const entry = byPlace.get(placeKey(option));
      return {
        ...option,
        managed: entry !== undefined && tagValue(entry.product.tags, TAG_KEY.tenant) === installationNamespace,
        product: entry
          ? { url: entry.product.url, vulnerabilities: entry.vulnerabilities, secrets: entry.secrets }
          : null,
      };
    })
    .sort(compareOverviewNamespaces());

  return { ...scope, namespaces, secretsTruncated };
}
