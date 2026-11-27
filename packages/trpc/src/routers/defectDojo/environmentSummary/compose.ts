import {
  NO_FINDING_COUNTS,
  hasActiveEnvironmentFindings,
  hasActiveFindings,
  isRunningEnvironmentContainer,
  runtimeStateOf,
  totalOf,
  type EnvironmentApplication,
  type EnvironmentContainer,
  type EnvironmentRuntime,
  type EnvironmentSummary,
  type SeverityCounts,
} from "@my-project/shared";
import { dataOf, outageOf, type DefectDojoTest } from "../../../clients/defectDojo/index.js";
import { buildRuntimeContainers, namespaceTags, type RuntimeContainerEntry } from "../codebaseFindings/runtime.js";
import { isNewer, latestDate } from "../codebaseFindings/scans.js";
import { TAG_KEY, tagValue } from "../codebaseFindings/tags.js";
import { SECRET_LIST } from "../platformFindings/list.js";
import { NO_SECRETS, readSecretCounts, splitOffSecrets } from "../securityOverview/namespaceCounts.js";
import { countEach } from "../securityOverview/source.js";
import { groupBy } from "../../../utils/groupBy/index.js";
import type { EnvironmentFacts } from "./facts.js";
import type { EnvironmentSummarySource } from "./source.js";

/** Per codebase of the Stage, by codebase, its first Application by name: the value of the test tag `app`. */
function applicationsOfStage({ applications, cdPipeline, stage }: EnvironmentFacts): [string, string][] {
  const ofStage = (applications ?? [])
    .filter(
      (application) => application.codebase && application.cdPipeline === cdPipeline && application.stage === stage
    )
    .sort((a, b) => a.name.localeCompare(b.name));
  const byCodebase = new Map<string, string>();
  for (const { codebase, name } of ofStage) {
    if (codebase && !byCodebase.has(codebase)) {
      byCodebase.set(codebase, name);
    }
  }
  return [...byCodebase].sort(([a], [b]) => a.localeCompare(b));
}

function countedTestIds(entry: RuntimeContainerEntry): number[] {
  return entry.state === "running"
    ? [entry.vulnerabilities, entry.secrets].flatMap((report) => (report ? [report.testId] : []))
    : [];
}

function toContainer(entry: RuntimeContainerEntry, countOf: ReadonlyMap<number, SeverityCounts>): EnvironmentContainer {
  const { workload, container, image } = entry;
  if (entry.state !== "running") {
    return { workload, container, image, state: "notRunning" };
  }

  const vulnerabilities = entry.vulnerabilities && (countOf.get(entry.vulnerabilities.testId) ?? NO_FINDING_COUNTS);
  const secrets = entry.secrets && totalOf(countOf.get(entry.secrets.testId) ?? NO_FINDING_COUNTS);
  return { workload, container, image, state: "running", vulnerabilities, secrets };
}

function toApplication(codebase: string, containers: EnvironmentContainer[]): EnvironmentApplication {
  const running = containers.filter(isRunningEnvironmentContainer);
  return {
    codebase,
    state: runtimeStateOf({
      containers: containers.length,
      running: running.length,
      hasFindings: running.some(hasActiveEnvironmentFindings),
    }),
    containers,
  };
}

function isSecretsTest(test: DefectDojoTest): boolean {
  return tagValue(test.tags, TAG_KEY.reportKind) === SECRET_LIST.reportKind;
}

/** A stale product keeps its old tests: the newest test belongs to the product in use. */
function newestOf(tests: readonly DefectDojoTest[]): DefectDojoTest {
  return tests.reduce(
    (newest, test) =>
      isNewer({ date: test.updated, testId: test.id }, { date: newest.updated, testId: newest.id }) ? test : newest,
    tests[0]
  );
}

/** The counts of the namespace products of the open tests, the exposed secrets apart, as on Security > Overview. */
async function readRuntime(
  source: EnvironmentSummarySource,
  tags: readonly string[],
  tests: readonly DefectDojoTest[]
): Promise<EnvironmentRuntime> {
  const open = tests.filter((test) => !test.closed);
  const { url } = newestOf(open.length > 0 ? open : tests).product;
  const lastUpload = latestDate(open.map((test) => test.updated));
  if (lastUpload === null) {
    return { state: "notRunning", url };
  }

  const productIds = [...new Set(open.map((test) => test.product.id))];
  const [[productCounts], secrets] = await Promise.all([
    countEach(source, [{ productIds }], { state: "active" }),
    open.some(isSecretsTest) ? readSecretCounts(source, "active", { all: tags }) : NO_SECRETS,
  ]);

  const counts = splitOffSecrets(productIds, productCounts, secrets);
  if (!hasActiveFindings(counts.vulnerabilities) && !hasActiveFindings(counts.secrets)) {
    return { state: "clean", url, lastUpload };
  }
  return { state: "data", url, ...counts, secretsTruncated: secrets.truncated, lastUpload };
}

/**
 * The workloads of the Stage's namespace: the namespace product with its counts, and per codebase of the Stage the
 * containers of its Application with the counts of their open tests. Any failed read makes the whole summary
 * unreachable or not configured: no partial data.
 */
export async function composeEnvironmentSummary(
  source: EnvironmentSummarySource,
  facts: EnvironmentFacts
): Promise<EnvironmentSummary> {
  try {
    const tags = namespaceTags(facts);
    // A CI scan may carry the namespace tags too; only the security operator's tests are the namespace's runtime.
    const tests = (dataOf(await source.listTests({ tags })) ?? []).filter((test) => test.level === "runtime");
    if (tests.length === 0) {
      return { state: "noScanData" };
    }

    const containers = buildRuntimeContainers(tests);
    const byApp = groupBy(
      containers,
      (entry) => entry.app,
      (entry) => entry
    );
    const containersOfCodebase = applicationsOfStage(facts).map(
      ([codebase, app]) => [codebase, byApp.get(app) ?? []] as const
    );
    const counted = containersOfCodebase.flatMap(([, entries]) => entries.flatMap(countedTestIds));

    const [runtime, cellCounts] = await Promise.all([
      readRuntime(source, tags, tests),
      countEach(
        source,
        counted.map((testId) => ({ testId })),
        { state: "active", testExists: true }
      ),
    ]);
    const countOf = new Map(counted.map((testId, index) => [testId, cellCounts[index]]));

    const applicationsWithCodebase =
      facts.applications &&
      new Set(facts.applications.flatMap((application) => (application.codebase ? [application.name] : [])));
    const running = containers.filter((entry) => entry.state === "running");

    return {
      state: "data",
      place: { cluster: facts.clusterName, namespace: facts.namespace },
      runtime,
      containers: {
        scanned: running.length,
        withoutCodebase:
          applicationsWithCodebase &&
          running.filter((entry) => entry.app === null || !applicationsWithCodebase.has(entry.app)).length,
        notRunning: containers.length - running.length,
      },
      applications:
        facts.applications &&
        containersOfCodebase.map(([codebase, entries]) =>
          toApplication(
            codebase,
            entries.map((entry) => toContainer(entry, countOf))
          )
        ),
    };
  } catch (error) {
    return outageOf(error);
  }
}
