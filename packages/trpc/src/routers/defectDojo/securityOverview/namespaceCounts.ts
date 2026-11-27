import {
  DEFECTDOJO_SEVERITIES,
  NO_FINDING_COUNTS,
  sumCounts,
  type DefectDojoSeverity,
  type SecurityOverviewRequest,
  type SeverityCounts,
} from "@my-project/shared";
import { dataOf, type DefectDojoClient, type DefectDojoTestTags } from "../../../clients/defectDojo/index.js";
import { TAG_KEY, formatTag } from "../codebaseFindings/tags.js";
import { SECRET_LIST, openRows, readMostSevere } from "../platformFindings/list.js";

/** The exposed secrets of namespace products, by product id. */
export interface SecretCounts {
  /** Every secret of the state: what the count of its product holds besides the vulnerabilities. */
  all: Map<number, SeverityCounts>;
  /** The secrets of open tests only, as the Exposed Secrets list shows them. */
  open: Map<number, SeverityCounts>;
  truncated: boolean;
}

export const NO_SECRETS: SecretCounts = { all: new Map(), open: new Map(), truncated: false };

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
 * The exposed-secret findings of the state, of the tests that also carry `tags`, by namespace product. A close
 * mitigates the findings of a test, but the flags of a triaged finding outlive it: its count holds them, while the
 * lists leave closed tests out.
 */
export async function readSecretCounts(
  source: Pick<DefectDojoClient, "listFindings">,
  state: SecurityOverviewRequest["state"],
  tags: DefectDojoTestTags = { all: [] }
): Promise<SecretCounts> {
  const read = dataOf(
    await readMostSevere(source, {
      scope: { testTags: { ...tags, all: [formatTag(TAG_KEY.reportKind, SECRET_LIST.reportKind), ...tags.all] } },
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

/** The count of namespace products split into their vulnerabilities and their exposed secrets. */
export function splitOffSecrets(
  productIds: readonly number[],
  counts: Readonly<SeverityCounts>,
  secrets: SecretCounts
): { vulnerabilities: SeverityCounts; secrets: SeverityCounts } {
  const of = (byProduct: Map<number, SeverityCounts>) =>
    sumCounts(productIds.map((id) => byProduct.get(id) ?? NO_FINDING_COUNTS));
  return { vulnerabilities: withoutSecrets(counts, of(secrets.all)), secrets: of(secrets.open) };
}
