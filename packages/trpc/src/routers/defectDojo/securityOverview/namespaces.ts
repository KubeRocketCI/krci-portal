import {
  compareOverviewNamespaces,
  type OverviewNamespace,
  type SecurityOverview,
  type SecurityOverviewRequest,
  type SeverityCounts,
} from "@my-project/shared";
import { dataOf, type DefectDojoProduct, type DefectDojoResult } from "../../../clients/defectDojo/index.js";
import { TAG_KEY, tagValue } from "../codebaseFindings/tags.js";
import type { PlatformFacts } from "../platformFindings/facts.js";
import {
  NAMESPACE_PRODUCT_TAG_TEXT,
  findingsScopeOf,
  namespaceOf,
  placeKey,
  type Place,
} from "../platformFindings/scope.js";
import { createOverviewCache } from "./cache.js";
import { readSecretCounts, splitOffSecrets } from "./namespaceCounts.js";
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
        ...splitOffSecrets([product.id], counts[index], secrets),
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
