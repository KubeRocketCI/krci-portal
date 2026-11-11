import { SECURITY_SEVERITIES, type SecurityCounts, type SecuritySeverity } from "@my-project/shared";
import {
  CODE_ENGAGEMENT_PREFIX,
  ENVIRONMENT_TAG_PREFIX,
  IMAGE_ENGAGEMENT_PREFIX,
  RUNTIME_ENGAGEMENT_PREFIX,
  RUNTIME_SCOPE_TAG,
  TENANT_TAG_PREFIX,
  WORKLOAD_TAG_PREFIX,
  SEVERITY_LISTING_LIMIT,
  toSecuritySeverity,
  type DefectDojoClient,
  type DefectDojoEngagement,
  type DefectDojoFindingsFilter,
  type DefectDojoTest,
} from "../../clients/defectdojo/index.js";
import { mapWithConcurrency } from "../../utils/mapWithConcurrency/index.js";

/** DefectDojo requests in flight at once. */
const DEFECTDOJO_CONCURRENCY = 4;

type CountedSeverity = Exclude<SecuritySeverity, "unassigned">;

/** Severities with a count request of their own; `unassigned` (DefectDojo `Info`) is the remainder. */
const COUNTED_SEVERITIES = SECURITY_SEVERITIES.filter(
  (severity): severity is CountedSeverity => severity !== "unassigned"
);

export type EngagementKind =
  | { scope: "ci"; kind: "code"; branch?: string }
  | { scope: "ci"; kind: "image"; image?: string }
  | { scope: "runtime" };

export interface ClassifiedEngagement {
  engagement: DefectDojoEngagement;
  tests: DefectDojoTest[];
  kind: EngagementKind;
}

/** Test tag of a tenant: `krci-tenant:<namespace of the portal>`. */
export function tenantTag(tenant: string): string {
  return `${TENANT_TAG_PREFIX}${tenant}`;
}

/** Test tag of an environment: `krci-env:<cdPipeline>.<stage>`. */
export function environmentTag(cdPipeline: string, stage: string): string {
  return `${ENVIRONMENT_TAG_PREFIX}${cdPipeline}.${stage}`;
}

/** Tags the tests of runtime findings must carry: the tenant, and the environment when one is given. */
export function runtimeTestTags(tenant: string, cdPipeline?: string, stage?: string): string[] {
  return cdPipeline && stage ? [tenantTag(tenant), environmentTag(cdPipeline, stage)] : [tenantTag(tenant)];
}

/** `<cdPipeline>/<stage>` from the tags of a test, when it carries an environment tag. */
export function environmentOf(tags: readonly string[]): string | undefined {
  const tag = tags.find((candidate) => candidate.startsWith(ENVIRONMENT_TAG_PREFIX));
  if (!tag) {
    return undefined;
  }

  // CD pipeline and stage names are DNS labels: the first dot separates them.
  const [cdPipeline, ...rest] = tag.slice(ENVIRONMENT_TAG_PREFIX.length).split(".");
  const stage = rest.join(".");
  return cdPipeline && stage ? `${cdPipeline}/${stage}` : undefined;
}

/** `<kind>/<name>` of the workloads named by the tags of a test. */
export function workloadsOf(tags: readonly string[]): string[] {
  return tags
    .filter((tag) => tag.startsWith(WORKLOAD_TAG_PREFIX))
    .map((tag) => tag.slice(WORKLOAD_TAG_PREFIX.length).replace(".", "/"));
}

/** CI engagements by name; a runtime engagement by name or by the scope tag of one of the tenant's tests. */
export function classifyEngagement(
  engagement: DefectDojoEngagement,
  tenantTests: DefectDojoTest[]
): EngagementKind | undefined {
  const { name } = engagement;

  if (name.startsWith(CODE_ENGAGEMENT_PREFIX)) {
    return { scope: "ci", kind: "code", branch: name.slice(CODE_ENGAGEMENT_PREFIX.length) || undefined };
  }

  if (name.startsWith(IMAGE_ENGAGEMENT_PREFIX)) {
    return { scope: "ci", kind: "image", image: name.slice(IMAGE_ENGAGEMENT_PREFIX.length) || undefined };
  }

  if (name.startsWith(RUNTIME_ENGAGEMENT_PREFIX) || tenantTests.some((test) => test.tags.includes(RUNTIME_SCOPE_TAG))) {
    return { scope: "runtime" };
  }

  return undefined;
}

/**
 * The engagements of a product that hold CI or runtime scans, with their tests.
 * CI engagements keep all their tests, which carry no tenant tag. A runtime engagement keeps only the tests
 * tagged with `tenant` and is left out when it has none.
 */
export async function loadClassifiedEngagements(
  client: DefectDojoClient,
  productId: number,
  tenant: string
): Promise<ClassifiedEngagement[]> {
  const tenantTestTag = tenantTag(tenant);
  const engagements = await client.listEngagements(productId);

  const loaded = await mapWithConcurrency(engagements, DEFECTDOJO_CONCURRENCY, async (engagement) => ({
    engagement,
    tests: (await client.listTestsByEngagement(engagement.id)).tests,
  }));

  return loaded.flatMap(({ engagement, tests }): ClassifiedEngagement[] => {
    const tenantTests = tests.filter((test) => test.tags.includes(tenantTestTag));
    const kind = classifyEngagement(engagement, tenantTests);
    if (!kind) {
      return [];
    }

    if (kind.scope === "runtime") {
      return tenantTests.length > 0 ? [{ engagement, tests: tenantTests, kind }] : [];
    }

    return [{ engagement, tests, kind }];
  });
}

/**
 * Severity counts per filter. A filter with at most `SEVERITY_LISTING_LIMIT` findings is counted from one listing,
 * a larger one with a count request per severity; its unassigned count is the remainder.
 */
export async function countFindingRows(
  client: DefectDojoClient,
  filters: readonly DefectDojoFindingsFilter[]
): Promise<SecurityCounts[]> {
  const listings = await mapWithConcurrency(filters, DEFECTDOJO_CONCURRENCY, (filter) =>
    client.listFindingSeverities(filter, SEVERITY_LISTING_LIMIT)
  );

  const counts = listings.map(() => emptyCounts());
  const totals = listings.map(({ count }) => count);

  const requests: { row: number; severity: CountedSeverity }[] = [];
  listings.forEach(({ count, severities }, row) => {
    if (count <= SEVERITY_LISTING_LIMIT) {
      for (const severity of severities) {
        counts[row][toSecuritySeverity(severity)] += 1;
      }
      return;
    }

    for (const severity of COUNTED_SEVERITIES) {
      requests.push({ row, severity });
    }
  });

  const results = await mapWithConcurrency(requests, DEFECTDOJO_CONCURRENCY, async ({ row, severity }) => ({
    row,
    severity,
    count: await client.countFindings({ ...filters[row], severities: [severity] }),
  }));

  for (const { row, severity, count } of results) {
    counts[row][severity] = count;
  }

  for (const row of new Set(requests.map((request) => request.row))) {
    const counted = COUNTED_SEVERITIES.reduce((sum, severity) => sum + counts[row][severity], 0);
    counts[row].unassigned = Math.max(0, totals[row] - counted);
  }

  return counts;
}

/** Counts with every severity at zero. */
function emptyCounts(): SecurityCounts {
  return Object.fromEntries(SECURITY_SEVERITIES.map((severity) => [severity, 0])) as SecurityCounts;
}

/** Distinct values, sorted. */
export function sortedUnique(values: Iterable<string>): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

/** The first value that is neither empty nor null; an empty string falls through like a missing value. */
export function firstNonEmpty(...values: ReadonlyArray<string | null | undefined>): string | undefined {
  return values.find((value): value is string => typeof value === "string" && value !== "");
}

/** The scanners that produced the tests. */
export function toolsOf(tests: readonly DefectDojoTest[]): string[] {
  return sortedUnique(tests.map((test) => firstNonEmpty(test.test_type_name, test.scan_type) ?? test.title));
}

/** Image tags or versions the tests were run for. */
export function versionsOf(tests: readonly DefectDojoTest[]): string[] {
  return sortedUnique(tests.flatMap((test) => (test.version ? [test.version] : [])));
}

function newestTest(tests: readonly DefectDojoTest[]): DefectDojoTest | undefined {
  let newest: DefectDojoTest | undefined;

  for (const test of tests) {
    if (test.updated && (!newest?.updated || Date.parse(test.updated) > Date.parse(newest.updated))) {
      newest = test;
    }
  }

  return newest;
}

/** Newest test update, as DefectDojo reports it. */
export function updatedOf(tests: readonly DefectDojoTest[]): string | undefined {
  return newestTest(tests)?.updated ?? undefined;
}

/** Version of the most recently updated test that has one. */
export function latestVersionOf(tests: readonly DefectDojoTest[]): string | undefined {
  return newestTest(tests.filter((test) => test.version))?.version ?? undefined;
}
