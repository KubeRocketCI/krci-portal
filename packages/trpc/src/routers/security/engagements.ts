import { SECURITY_SEVERITIES, type SecurityCounts, type SecuritySeverity } from "@my-project/shared";
import {
  CODE_ENGAGEMENT_PREFIX,
  IMAGE_ENGAGEMENT_PREFIX,
  SEVERITY_LISTING_LIMIT,
  toSecuritySeverity,
  type DefectDojoClient,
  type DefectDojoEngagement,
  type DefectDojoFindingsFilter,
  type DefectDojoTest,
} from "../../clients/defectdojo/index.js";
import { mapWithConcurrency } from "../../utils/mapWithConcurrency/index.js";

/** DefectDojo requests in flight at once. */
export const DEFECTDOJO_CONCURRENCY = 4;

type CountedSeverity = Exclude<SecuritySeverity, "unassigned">;

/** Severities with a count request of their own; `unassigned` (DefectDojo `Info`) is the remainder. */
export const COUNTED_SEVERITIES = SECURITY_SEVERITIES.filter(
  (severity): severity is CountedSeverity => severity !== "unassigned"
);

export type EngagementKind = { kind: "code"; branch?: string } | { kind: "image"; image?: string };

export interface CiEngagement {
  engagement: DefectDojoEngagement;
  kind: EngagementKind;
}

export interface ClassifiedEngagement extends CiEngagement {
  tests: DefectDojoTest[];
}

/** CI engagements by name. */
export function classifyEngagement(engagement: DefectDojoEngagement): EngagementKind | undefined {
  const { name } = engagement;

  if (name.startsWith(CODE_ENGAGEMENT_PREFIX)) {
    return { kind: "code", branch: name.slice(CODE_ENGAGEMENT_PREFIX.length) || undefined };
  }

  if (name.startsWith(IMAGE_ENGAGEMENT_PREFIX)) {
    return { kind: "image", image: name.slice(IMAGE_ENGAGEMENT_PREFIX.length) || undefined };
  }

  return undefined;
}

/** The CI engagements of a product. */
export async function listCiEngagements(client: DefectDojoClient, productId: number): Promise<CiEngagement[]> {
  return (await client.listEngagements(productId)).flatMap((engagement) => {
    const kind = classifyEngagement(engagement);
    return kind ? [{ engagement, kind }] : [];
  });
}

/** The CI engagements of a product, with their tests. */
export async function loadClassifiedEngagements(
  client: DefectDojoClient,
  productId: number
): Promise<ClassifiedEngagement[]> {
  const engagements = await listCiEngagements(client, productId);

  return mapWithConcurrency(engagements, DEFECTDOJO_CONCURRENCY, async ({ engagement, kind }) => ({
    engagement,
    kind,
    tests: await client.listTestsByEngagement(engagement.id),
  }));
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

/** A copy of the items ordered by the string key, so the input array is left as it was. */
export function sortedCopy<T>(items: readonly T[], keyOf: (item: T) => string): T[] {
  return [...items].sort((a, b) => keyOf(a).localeCompare(keyOf(b)));
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
