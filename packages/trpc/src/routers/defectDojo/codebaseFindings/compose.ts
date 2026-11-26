import {
  NO_FINDING_COUNTS,
  hasActiveFindings,
  hasActiveRuntimeFindings,
  scanRefKey,
  type CodebaseFindings,
  type CodebaseLevel,
  type CodebaseScan,
  type CodebaseScanRef,
  type RuntimeContainer,
  type RuntimeContainerRef,
  type RuntimeEnvironment,
  type RuntimeLevel,
  type ScanFinding,
  type ScanFindings,
  type ScanFindingsRequest,
  type ScanRef,
  type SeverityCounts,
} from "@my-project/shared";
import {
  dataOf,
  outageOf,
  type DefectDojoFinding,
  type DefectDojoTest,
  type DefectDojoTestsFilter,
} from "../../../clients/defectDojo/index.js";
import { mapWithConcurrency } from "../../../utils/mapWithConcurrency/index.js";
import type { CodebaseFacts } from "./facts.js";
import {
  buildRuntimeContainers,
  runtimeTestsFilter,
  type RuntimeContainerEntry,
  type RuntimeReportTest,
} from "./runtime.js";
import { buildScans, ciTestTags, latestDate, scanTestsFilter, type ScanEntry } from "./scans.js";
import type { CodebaseFindingsSource } from "./source.js";

/** Tests counted at once, and Environments listed at once: a codebase with many scans does not flood DefectDojo. */
export const COUNT_CONCURRENCY = 6;

async function readTests(source: CodebaseFindingsSource, filter: DefectDojoTestsFilter): Promise<DefectDojoTest[]> {
  return dataOf(await source.listTests(filter)) ?? [];
}

async function readScans(
  source: CodebaseFindingsSource,
  facts: CodebaseFacts,
  filter: DefectDojoTestsFilter = { tags: ciTestTags(facts) }
): Promise<ScanEntry[]> {
  return buildScans(facts, await readTests(source, filter));
}

interface TestCount {
  /** Active findings by severity. Zero everywhere when the test was not counted by severity. */
  counts: SeverityCounts;
  active: number;
  /** Findings that are not active: mitigated, false positive, out of scope, risk accepted. */
  triaged: number;
}

interface CountTarget {
  testId: number;
  bySeverity: boolean;
}

/**
 * Counts one test. The counts of all states come first: they tell whether the second request, for the active
 * findings by severity, is needed. `null`: the test is gone.
 */
async function countTest(
  source: CodebaseFindingsSource,
  { testId, bySeverity }: CountTarget
): Promise<TestCount | null> {
  const scope = { testId };

  // The test comes from a list: it exists, so a count of zero is a clean test.
  const all = dataOf(await source.getSeverityCounts(scope, { state: "any", testExists: true }));
  if (all === null) {
    return null;
  }

  let counts: SeverityCounts = NO_FINDING_COUNTS;
  if (bySeverity && all.active > 0) {
    const active = dataOf(await source.getSeverityCounts(scope, { state: "active", testExists: true }));
    if (active === null) {
      return null;
    }
    counts = active.severity;
  }

  return { counts, active: all.active, triaged: all.total - all.active };
}

function toCodebaseScan(
  { ref, ownImage, version, date, testUrl, productUrl }: ScanEntry,
  { counts, triaged }: TestCount
): CodebaseScan {
  return { ref, ownImage, version, date, counts, triaged, testUrl, productUrl };
}

function toLevel(scans: CodebaseScan[]): CodebaseLevel {
  if (scans.length === 0) {
    return { state: "noScanData", scans, lastUpload: null };
  }

  const hasActiveFinding = scans.some((scan) => hasActiveFindings(scan.counts));
  return { state: hasActiveFinding ? "data" : "clean", scans, lastUpload: latestDate(scans.map((scan) => scan.date)) };
}

function countTargets(container: RuntimeContainerEntry): CountTarget[] {
  if (container.state !== "running") {
    return [];
  }

  return [
    ...(container.vulnerabilities ? [{ testId: container.vulnerabilities.testId, bySeverity: true }] : []),
    ...(container.secrets ? [{ testId: container.secrets.testId, bySeverity: false }] : []),
  ];
}

type CountOf = ReadonlyMap<number, TestCount | null>;

function toVulnerabilities(report: RuntimeReportTest | null, countOf: CountOf) {
  const count = report && countOf.get(report.testId);
  return report && count ? { counts: count.counts, triaged: count.triaged, testUrl: report.testUrl } : null;
}

function toSecrets(report: RuntimeReportTest | null, countOf: CountOf) {
  const count = report && countOf.get(report.testId);
  return report && count ? { active: count.active, triaged: count.triaged, testUrl: report.testUrl } : null;
}

function toRuntimeContainer(container: RuntimeContainerEntry, countOf: CountOf): RuntimeContainer {
  if (container.state !== "running") {
    return container;
  }

  return {
    ...container,
    vulnerabilities: toVulnerabilities(container.vulnerabilities, countOf),
    secrets: toSecrets(container.secrets, countOf),
  };
}

function toRuntimeLevel(environments: RuntimeEnvironment[]): RuntimeLevel {
  const containers = environments.flatMap((environment) => environment.containers);
  if (containers.length === 0) {
    return { state: "noScanData", environments, lastUpload: null };
  }

  const running = containers.flatMap((container) => (container.state === "running" ? [container] : []));
  if (running.length === 0) {
    return { state: "notRunning", environments, lastUpload: null };
  }

  return {
    state: running.some(hasActiveRuntimeFindings) ? "data" : "clean",
    environments,
    lastUpload: latestDate(running.map((container) => container.date)),
  };
}

/**
 * The three levels of the tab for a codebase. Any failed read makes the whole result unreachable or not configured: no
 * partial data.
 */
export async function composeCodebaseFindings(
  source: CodebaseFindingsSource,
  facts: CodebaseFacts
): Promise<CodebaseFindings> {
  try {
    const [scans, environmentTests] = await Promise.all([
      readScans(source, facts),
      mapWithConcurrency(facts.environments, COUNT_CONCURRENCY, (environment) =>
        readTests(source, runtimeTestsFilter(environment))
      ),
    ]);
    const containersOf = environmentTests.map((tests) => buildRuntimeContainers(facts, tests));

    const targets: CountTarget[] = [
      ...scans.map(({ testId }) => ({ testId, bySeverity: true })),
      ...containersOf.flat().flatMap(countTargets),
    ];
    const counted = await mapWithConcurrency(targets, COUNT_CONCURRENCY, (target) => countTest(source, target));
    const countOf = new Map(targets.map(({ testId }, index) => [testId, counted[index]]));

    const countedScans = scans.flatMap((entry) => {
      const count = countOf.get(entry.testId) ?? null;
      return count === null ? [] : [toCodebaseScan(entry, count)];
    });
    const environments = facts.environments.map(({ cdPipeline, stage, clusterName, namespace }, index) => ({
      cdPipeline,
      stage,
      clusterName,
      namespace,
      containers: containersOf[index].map((container) => toRuntimeContainer(container, countOf)),
    }));

    return {
      state: "data",
      levels: {
        code: toLevel(countedScans.filter((scan) => scan.ref.level === "code")),
        image: toLevel(countedScans.filter((scan) => scan.ref.level === "image")),
        runtime: toRuntimeLevel(environments),
      },
    };
  } catch (error) {
    return outageOf(error);
  }
}

export function toScanFinding(finding: DefectDojoFinding): ScanFinding {
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

/** The test of a CI scan. The scan is found among the scans of the codebase, so a branch without a CodebaseBranch has none. */
async function findScanTestId(
  source: CodebaseFindingsSource,
  facts: CodebaseFacts,
  scan: CodebaseScanRef
): Promise<number | null> {
  const filter = scanTestsFilter(facts, scan);
  if (filter === null) {
    return null;
  }

  const scans = await readScans(source, facts, filter);
  return scans.find((candidate) => scanRefKey(candidate.ref) === scanRefKey(scan))?.testId ?? null;
}

/**
 * The Environment is one of the codebase, the container one of its tests: the cluster, namespace and Application come
 * from Kubernetes, never from the request.
 */
async function findRuntimeTestId(
  source: CodebaseFindingsSource,
  facts: CodebaseFacts,
  scan: RuntimeContainerRef
): Promise<number | null> {
  const environment = facts.environments.find(
    (candidate) => candidate.cdPipeline === scan.cdPipeline && candidate.stage === scan.stage
  );
  if (environment === undefined) {
    return null;
  }

  const tests = await readTests(source, runtimeTestsFilter(environment, scan));
  const container = buildRuntimeContainers(facts, tests).find(
    (candidate) => candidate.workload === scan.workload && candidate.container === scan.container
  );
  if (container?.state !== "running") {
    return null;
  }

  const report = scan.reportKind === "vulnerabilityreport" ? container.vulnerabilities : container.secrets;
  return report?.testId ?? null;
}

function findTestId(source: CodebaseFindingsSource, facts: CodebaseFacts, scan: ScanRef): Promise<number | null> {
  return scan.level === "runtime" ? findRuntimeTestId(source, facts, scan) : findScanTestId(source, facts, scan);
}

/** One page of the findings of a scan or of a container report, most severe first. */
export async function readScanFindings(
  source: CodebaseFindingsSource,
  facts: CodebaseFacts,
  request: ScanFindingsRequest
): Promise<ScanFindings> {
  try {
    const testId = await findTestId(source, facts, request.scan);
    if (testId === null) {
      return { state: "noScanData" };
    }

    const page = dataOf(
      await source.listFindings({
        scope: { testId },
        state: request.showTriaged ? "any" : "active",
        severities: request.severity ? [request.severity] : [],
        limit: request.pageSize,
        offset: request.page * request.pageSize,
      })
    );

    return page === null
      ? { state: "noScanData" }
      : { state: "data", total: page.total, findings: page.findings.map(toScanFinding) };
  } catch (error) {
    return outageOf(error);
  }
}
