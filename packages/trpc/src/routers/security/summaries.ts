import type {
  SecurityCiSummary,
  SecurityCodebaseSummary,
  SecurityEnvironmentApplication,
  SecurityEnvironmentOther,
  SecurityEnvironmentSummary,
  SecurityFinding,
  SecurityFindingsPage,
  SecurityListFindingsInput,
  SecurityRuntimeSummary,
} from "@my-project/shared";
import { TRPCError } from "@trpc/server";
import {
  ENVIRONMENT_PRODUCT_PREFIX,
  RUNTIME_ENGAGEMENT_PREFIX,
  toSecuritySeverity,
  type DefectDojoClient,
  type DefectDojoFinding,
  type DefectDojoTest,
} from "../../clients/defectdojo/index.js";
import {
  countFindingRows,
  environmentOf,
  firstNonEmpty,
  latestVersionOf,
  loadClassifiedEngagements,
  sortedUnique,
  runtimeTestTags,
  toolsOf,
  updatedOf,
  versionsOf,
  workloadsOf,
  type ClassifiedEngagement,
} from "./engagements.js";

/** A copy of the items ordered by the string key, so the input array is left as it was. */
function sortedCopy<T>(items: readonly T[], keyOf: (item: T) => string): T[] {
  return [...items].sort((a, b) => keyOf(a).localeCompare(keyOf(b)));
}

/** `<cdPipeline>/<stage>` from the environment tag of the tests; the engagement name without its prefix when no test is tagged. */
function environmentOfEngagement({ engagement, tests }: ClassifiedEngagement): string {
  return (
    tests.map((test) => environmentOf(test.tags)).find((environment) => environment !== undefined) ??
    engagement.name.slice(RUNTIME_ENGAGEMENT_PREFIX.length)
  );
}

function workloadsOfTests(tests: readonly DefectDojoTest[]): string[] {
  return sortedUnique(tests.flatMap((test) => workloadsOf(test.tags)));
}

/** Tags the tests of the findings of an engagement must carry: the tenant and the environment for runtime scans. */
function findingsTestTags(entry: ClassifiedEngagement, tenant: string): string[] | undefined {
  if (entry.kind.scope === "ci") {
    return undefined;
  }

  const [cdPipeline, stage] = environmentOfEngagement(entry).split("/");
  return runtimeTestTags(tenant, cdPipeline, stage);
}

/** CI scans and runtime scans of one codebase. */
export async function getCodebaseSummary(
  client: DefectDojoClient,
  codebase: string,
  tenant: string
): Promise<SecurityCodebaseSummary> {
  const none: SecurityCodebaseSummary = { status: "NONE", codebase, ci: [], runtime: [] };

  const product = await client.getProductByName(codebase);
  if (!product) {
    return none;
  }

  const classified = await loadClassifiedEngagements(client, product.id, tenant);
  if (classified.length === 0) {
    return none;
  }

  const counts = await countFindingRows(
    client,
    classified.map((entry) => ({
      engagementIds: [entry.engagement.id],
      testTags: findingsTestTags(entry, tenant),
    }))
  );

  const ci: SecurityCiSummary[] = [];
  const runtime: SecurityRuntimeSummary[] = [];

  classified.forEach((entry, index) => {
    const { engagement, tests, kind } = entry;

    const row = {
      tools: toolsOf(tests),
      counts: counts[index],
      updated: updatedOf(tests),
      link: client.engagementUrl(engagement.id),
    };

    if (kind.scope === "runtime") {
      runtime.push({
        environment: environmentOfEngagement(entry),
        workloads: workloadsOfTests(tests),
        versions: versionsOf(tests),
        ...row,
      });
    } else if (kind.kind === "code") {
      ci.push({ kind: "code", engagement: engagement.name, branch: kind.branch, ...row });
    } else {
      ci.push({ kind: "image", engagement: engagement.name, image: kind.image, tag: latestVersionOf(tests), ...row });
    }
  });

  return {
    status: "OK",
    codebase,
    ci: sortedCopy(ci, (item) => item.engagement),
    runtime: sortedCopy(runtime, (item) => item.environment),
    link: client.productUrl(product.id),
  };
}

/** The runtime scans of one environment, per application. */
export async function getEnvironmentSummary(
  client: DefectDojoClient,
  cdPipeline: string,
  stage: string,
  tenant: string
): Promise<SecurityEnvironmentSummary> {
  const environment = `${cdPipeline}/${stage}`;
  const testTags = runtimeTestTags(tenant, cdPipeline, stage);

  const { tests, engagements } = await client.listTestsByTags(testTags);

  interface ProductRows {
    productId: number;
    productName: string;
    engagementIds: Set<number>;
    tests: DefectDojoTest[];
  }

  const rowsByProduct = new Map<number, ProductRows>();
  for (const test of tests) {
    const engagement = engagements.get(test.engagement);
    if (!engagement) {
      continue;
    }

    const { id: productId, name: productName } = engagement.product;
    const row = rowsByProduct.get(productId) ?? { productId, productName, engagementIds: new Set(), tests: [] };
    row.engagementIds.add(test.engagement);
    row.tests.push(test);
    rowsByProduct.set(productId, row);
  }

  const rows = [...rowsByProduct.values()];
  if (rows.length === 0) {
    return { status: "NONE", environment, applications: [] };
  }

  const counts = await countFindingRows(
    client,
    rows.map((row) => ({ engagementIds: [...row.engagementIds], testTags }))
  );

  const environmentProduct = `${ENVIRONMENT_PRODUCT_PREFIX}${cdPipeline}-${stage}`;
  const applications: SecurityEnvironmentApplication[] = [];
  let other: SecurityEnvironmentOther | undefined;

  rows.forEach((row, index) => {
    const [firstEngagementId, ...moreEngagementIds] = row.engagementIds;
    const link =
      moreEngagementIds.length === 0 ? client.engagementUrl(firstEngagementId) : client.productUrl(row.productId);
    const updated = updatedOf(row.tests);
    const workloads = workloadsOfTests(row.tests);

    if (row.productName === environmentProduct) {
      other = { counts: counts[index], workloads, updated, link };
    } else {
      applications.push({
        codebase: row.productName,
        workloads,
        versions: versionsOf(row.tests),
        counts: counts[index],
        updated,
        link,
      });
    }
  });

  return {
    status: "OK",
    environment,
    applications: sortedCopy(applications, (application) => application.codebase),
    other,
  };
}

/** One page of the findings of a codebase, most severe first. */
export async function getFindingsPage(
  client: DefectDojoClient,
  input: SecurityListFindingsInput,
  tenant: string
): Promise<SecurityFindingsPage> {
  const { codebase, scope, environment, severity, page, pageSize } = input;

  if (environment && scope === "ci") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "environment applies to runtime findings only" });
  }

  const none: SecurityFindingsPage = { status: "NONE", items: [], totalCount: 0, page, pageSize };

  const product = await client.getProductByName(codebase);
  if (!product) {
    return none;
  }

  const selected = (await loadClassifiedEngagements(client, product.id, tenant)).filter(
    (entry) =>
      entry.kind.scope === scope && (environment === undefined || environmentOfEngagement(entry) === environment)
  );
  if (selected.length === 0) {
    return none;
  }

  const [cdPipeline, stage] = environment?.split("/") ?? [];
  const result = await client.listFindings(
    {
      engagementIds: selected.map(({ engagement }) => engagement.id),
      severities: severity,
      testTags: scope === "runtime" ? runtimeTestTags(tenant, cdPipeline, stage) : undefined,
    },
    { offset: (page - 1) * pageSize, limit: pageSize }
  );

  const engagementsById = new Map(selected.map((entry) => [entry.engagement.id, entry]));

  const items = result.findings.map((finding) => {
    const test = result.tests.get(finding.test);
    const entry = test && engagementsById.get(test.engagement);
    if (!test || !entry) {
      throw new Error(
        `Finding ${finding.id} belongs to test ${finding.test}, which is outside the requested engagements`
      );
    }
    return toSecurityFinding(client, finding, test, entry);
  });

  return { status: "OK", items, totalCount: result.totalCount, page, pageSize };
}

function toSecurityFinding(
  client: DefectDojoClient,
  finding: DefectDojoFinding,
  test: DefectDojoTest,
  entry: ClassifiedEngagement
): SecurityFinding {
  const { kind, engagement } = entry;

  return {
    id: finding.id,
    severity: toSecuritySeverity(finding.severity),
    title: finding.title,
    vulnId: firstNonEmpty(finding.vulnerability_ids?.[0]?.vulnerability_id),
    component: firstNonEmpty(finding.component_name, finding.file_path) ?? "",
    version: finding.component_version ?? "",
    fixedVersion: fixedVersionOf(finding),
    scope: kind.scope,
    environment: kind.scope === "runtime" ? (environmentOf(test.tags) ?? environmentOfEngagement(entry)) : undefined,
    workload: kind.scope === "runtime" ? workloadsOf(test.tags)[0] : undefined,
    branch: kind.scope === "ci" && kind.kind === "code" ? kind.branch : undefined,
    engagement: engagement.name,
    link: client.findingUrl(finding.id),
  };
}

/** `fix_version`, or the `mitigation` of a finding whose scanner reports a fix (Trivy writes the fixed version there). */
function fixedVersionOf(finding: DefectDojoFinding): string | undefined {
  return firstNonEmpty(finding.fix_version, finding.fix_available ? finding.mitigation : undefined);
}
