import {
  CODEBASE_SCAN_LEVELS,
  NO_FINDING_COUNTS,
  type CodebaseScanLevel,
  type OverviewCodebase,
  type SecurityOverviewCodebases,
  type SecurityOverviewCodebasesRequest,
  type SeverityCounts,
} from "@my-project/shared";
import { dataOf, isOutage, type DefectDojoResult } from "../../../clients/defectDojo/index.js";
import { groupBy } from "../../../utils/groupBy/index.js";
import { orderBranches } from "../codebaseFindings/facts.js";
import { compareScans, createOwnImageMatcher, newestScans, type NewestScan } from "../codebaseFindings/scans.js";
import { TAG_KEY, formatTag, tagValue } from "../codebaseFindings/tags.js";
import { sortedUnique } from "../platformFindings/facts.js";
import { createOverviewCache } from "./cache.js";
import { countEach, type SecurityOverviewSource } from "./source.js";
import type { TenantFacts } from "./tenantFacts.js";

/** A scan of every branch, counted in the state. */
export interface CountedScan {
  scan: NewestScan;
  counts: SeverityCounts;
}

/** What the Codebases part reads from DefectDojo: the scans of the tenant's CI tests by codebase tag, by name. */
export interface CodebasesPart {
  codebases: { codebase: string; scans: CountedScan[] }[];
}

async function readCodebasesPart(
  source: SecurityOverviewSource,
  namespace: string,
  state: SecurityOverviewCodebasesRequest["state"]
): Promise<DefectDojoResult<CodebasesPart>> {
  const tests = dataOf(await source.listTests({ tags: [formatTag(TAG_KEY.tenant, namespace)] })) ?? [];
  const testsByCodebase = groupBy(
    tests,
    (test) => tagValue(test.tags, TAG_KEY.codebase),
    (test) => test
  );
  const codebases = [...testsByCodebase]
    .flatMap(([codebase, codebaseTests]) => {
      const scans = newestScans(codebaseTests);
      return scans.length === 0 ? [] : [{ codebase, scans }];
    })
    .sort((a, b) => a.codebase.localeCompare(b.codebase));
  if (codebases.length === 0) {
    return { state: "noScanData" };
  }

  const scans = codebases.flatMap((codebase) => codebase.scans);
  // The tests come from a list: they exist, so a count of zero is a clean scan.
  const counts = await countEach(
    source,
    scans.map(({ testId }) => ({ testId })),
    { state, testExists: true }
  );
  const countOf = new Map(scans.map(({ testId }, index) => [testId, counts[index]]));

  return {
    state: "data",
    data: {
      codebases: codebases.map(({ codebase, scans: codebaseScans }) => ({
        codebase,
        scans: codebaseScans.map((scan) => ({ scan, counts: countOf.get(scan.testId) ?? NO_FINDING_COUNTS })),
      })),
    },
  };
}

const codebasesCache = createOverviewCache<CodebasesPart>();

/** The Codebases part of DefectDojo for the tenant `namespace`. */
export function loadCodebasesPart(
  source: SecurityOverviewSource,
  namespace: string,
  state: SecurityOverviewCodebasesRequest["state"]
): Promise<DefectDojoResult<CodebasesPart>> {
  return codebasesCache.read(`${source.cacheScope}\n${state}\n${namespace}`, () =>
    readCodebasesPart(source, namespace, state)
  );
}

function levelRank(level: CodebaseScanLevel): number {
  return CODEBASE_SCAN_LEVELS.indexOf(level);
}

/**
 * The scans of one codebase that the caller sees. A Codebase the caller may read keeps the scans of its CodebaseBranches;
 * a codebase tag without a Codebase, or a caller who may not list the CodebaseBranches, keeps every branch. Whose image
 * a scan is stays unknown to a caller who may not list the CodebaseImageStreams.
 */
function toOverviewCodebase(
  facts: TenantFacts,
  { codebase, scans }: CodebasesPart["codebases"][number]
): OverviewCodebase {
  const defaultBranch = facts.defaultBranches?.get(codebase) ?? null;
  const known = defaultBranch !== null;
  const branchFilter = known && facts.branches !== null ? (facts.branches.get(codebase) ?? []) : null;
  const branches = orderBranches(branchFilter ?? scans.map(({ scan }) => scan.ref.branch), defaultBranch);
  const ownImageNames = facts.ownImageNames;
  const isOwnImage = ownImageNames && createOwnImageMatcher({ ownImageNames: ownImageNames.get(codebase) ?? [] });
  const compare = compareScans(branches);

  return {
    codebase,
    known,
    scans: scans
      .filter(({ scan }) => branches.includes(scan.ref.branch))
      .map(({ scan, counts }) => ({
        ref: scan.ref,
        ownImage: isOwnImage ? isOwnImage(scan.ref.image) : null,
        version: scan.version,
        date: scan.date,
        testUrl: scan.testUrl,
        counts,
      }))
      .sort((a, b) => levelRank(a.ref.level) - levelRank(b.ref.level) || compare(a, b)),
  };
}

/** The codebases of the tenant with their scans, by name, and the Codebases the caller may read that have no scan. */
export function toSecurityOverviewCodebases(
  facts: TenantFacts,
  part: DefectDojoResult<CodebasesPart>
): SecurityOverviewCodebases {
  if (isOutage(part)) {
    return part;
  }
  const codebases = (part.state === "data" ? part.data.codebases : [])
    .map((codebase) => toOverviewCodebase(facts, codebase))
    .filter((codebase) => codebase.scans.length > 0);
  const scanned = new Set(codebases.map((codebase) => codebase.codebase));
  const unscanned = sortedUnique([...(facts.defaultBranches?.keys() ?? [])].filter((name) => !scanned.has(name)));

  return codebases.length === 0 ? { state: "noScanData", unscanned } : { state: "data", codebases, unscanned };
}
