import {
  scanRefKey,
  type CodebaseFindings,
  type CodebaseLevel,
  type CodebaseScan,
  type ScanFinding,
  type ScanFindings,
  type ScanFindingsRequest,
} from "@my-project/shared";
import type {
  DefectDojoFinding,
  DefectDojoResult,
  DefectDojoSeverityCounts,
  DefectDojoTest,
  DefectDojoTestsFilter,
} from "../../../clients/defectDojo/index.js";
import { mapWithConcurrency } from "../../../utils/mapWithConcurrency/index.js";
import type { CodebaseFacts } from "./facts.js";
import { buildScans, ciTestTags, scanTestsFilter, type ScanEntry } from "./scans.js";
import type { CodebaseFindingsSource } from "./source.js";

/** Scans counted at once: a codebase with many branches and images does not flood DefectDojo. */
const COUNT_CONCURRENCY = 6;

const NO_FINDINGS: DefectDojoSeverityCounts["severity"] = { Critical: 0, High: 0, Medium: 0, Low: 0, Info: 0 };

/** The state a failed read carries to the result. */
type Outage = { state: "notConfigured" } | { state: "unreachable" };

type ScansResult = Outage | { state: "data"; scans: ScanEntry[] };

/** Stops the counting of the other scans at the first failed read. */
class OutageFound extends Error {
  constructor(readonly outage: Outage) {
    super(outage.state);
  }
}

type CountedScan = { state: "data"; scan: CodebaseScan } | { state: "noScanData" } | Outage;

function isOutage(result: { state: string }): result is Outage {
  return result.state === "notConfigured" || result.state === "unreachable";
}

/** The CI tests of the codebase, or those of `filter`, as scans. No test is no scan. */
async function listScans(
  source: CodebaseFindingsSource,
  facts: CodebaseFacts,
  filter: DefectDojoTestsFilter = { tags: ciTestTags(facts) }
): Promise<ScansResult> {
  const tests: DefectDojoResult<DefectDojoTest[]> = await source.listTests(filter);

  return isOutage(tests)
    ? tests
    : { state: "data", scans: tests.state === "data" ? buildScans(facts, tests.data) : [] };
}

/**
 * Counts one scan: the active findings by severity and the findings that are not active. The counts of all states
 * come first: they tell whether the second request, for the active findings by severity, is needed.
 */
async function countScan(source: CodebaseFindingsSource, entry: ScanEntry): Promise<CountedScan> {
  const scope = { testId: entry.testId };

  // The test comes from a list: it exists, so a count of zero is a clean scan.
  const all = await source.getSeverityCounts(scope, { activeOnly: false, testExists: true });
  if (all.state !== "data") {
    return all;
  }

  let counts = NO_FINDINGS;
  if (all.data.active > 0) {
    const active = await source.getSeverityCounts(scope, { activeOnly: true, testExists: true });
    if (active.state !== "data") {
      return active;
    }
    counts = active.data.severity;
  }

  const { ref, ownImage, version, date, testUrl, productUrl } = entry;
  return {
    state: "data",
    scan: { ref, ownImage, version, date, counts, triaged: all.data.total - all.data.active, testUrl, productUrl },
  };
}

function toLevel(scans: CodebaseScan[]): CodebaseLevel {
  if (scans.length === 0) {
    return { state: "noScanData", scans, lastUpload: null };
  }

  const hasActiveFinding = scans.some((scan) => Object.values(scan.counts).some((count) => count > 0));
  const lastUpload = scans.reduce(
    (latest, scan) => (Date.parse(scan.date) > Date.parse(latest) ? scan.date : latest),
    scans[0].date
  );

  return { state: hasActiveFinding ? "data" : "clean", scans, lastUpload };
}

/** Both levels of the tab for a codebase. Any failed read makes the whole result unreachable: no partial data. */
export async function composeCodebaseFindings(
  source: CodebaseFindingsSource,
  facts: CodebaseFacts
): Promise<CodebaseFindings> {
  const listed = await listScans(source, facts);
  if (listed.state !== "data") {
    return listed;
  }

  let counted: CountedScan[];
  try {
    counted = await mapWithConcurrency(listed.scans, COUNT_CONCURRENCY, async (entry) => {
      const result = await countScan(source, entry);
      if (isOutage(result)) {
        throw new OutageFound(result);
      }
      return result;
    });
  } catch (error) {
    if (error instanceof OutageFound) {
      return error.outage;
    }
    throw error;
  }

  const scans = counted.flatMap((result) => (result.state === "data" ? [result.scan] : []));

  return {
    state: "data",
    levels: {
      code: toLevel(scans.filter((scan) => scan.ref.level === "code")),
      image: toLevel(scans.filter((scan) => scan.ref.level === "image")),
    },
  };
}

function toScanFinding(finding: DefectDojoFinding): ScanFinding {
  return {
    title: finding.title,
    severity: finding.severity,
    active: finding.active,
    mitigated: finding.mitigated,
    falsePositive: finding.falsePositive,
    outOfScope: finding.outOfScope,
    riskAccepted: finding.riskAccepted,
    underReview: finding.underReview,
    date: finding.date,
    componentName: finding.componentName,
    componentVersion: finding.componentVersion,
    vulnerabilityIds: finding.vulnerabilityIds,
    filePath: finding.filePath,
    line: finding.line,
    fixAvailable: finding.fixAvailable,
    fixVersion: finding.fixVersion,
    url: finding.url,
  };
}

/** One page of the findings of a scan. The scan is found among the scans of the codebase, so a branch without a CodebaseBranch has none. */
export async function readScanFindings(
  source: CodebaseFindingsSource,
  facts: CodebaseFacts,
  request: ScanFindingsRequest
): Promise<ScanFindings> {
  const filter = scanTestsFilter(facts, request.scan);
  if (filter === null) {
    return { state: "noScanData" };
  }

  const listed = await listScans(source, facts, filter);
  if (listed.state !== "data") {
    return listed;
  }

  const entry = listed.scans.find((candidate) => scanRefKey(candidate.ref) === scanRefKey(request.scan));
  if (!entry) {
    return { state: "noScanData" };
  }

  const page = await source.listFindings({
    scope: { testId: entry.testId },
    state: request.showTriaged ? "any" : "active",
    severities: request.severity ? [request.severity] : [],
    limit: request.pageSize,
    offset: request.page * request.pageSize,
  });
  if (page.state !== "data") {
    return page;
  }

  return { state: "data", total: page.data.total, findings: page.data.findings.map(toScanFinding) };
}
