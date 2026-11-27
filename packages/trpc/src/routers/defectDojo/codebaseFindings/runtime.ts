import { RUNTIME_REPORT_KINDS, type RuntimeReportKind } from "@my-project/shared";
import type { DefectDojoTest, DefectDojoTestsFilter } from "../../../clients/defectDojo/index.js";
import type { CodebaseEnvironment } from "./facts.js";
import { isNewer, latestDate } from "./scans.js";
import { TAG_KEY, formatTag, tagValue, type TagKey } from "./tags.js";

/** The test kept for one report kind of a container. */
export interface RuntimeReportTest {
  testId: number;
  testUrl: string;
}

interface RuntimeContainerBase {
  workload: string;
  container: string;
  image: string | null;
  ownImage: boolean;
  productUrl: string;
  /** The `app` tag: the name of the Argo CD Application of the workload. */
  app: string | null;
}

/** A workload container as the security operator's tests describe it, with the test ids the server resolves counts by. */
export type RuntimeContainerEntry = RuntimeContainerBase &
  (
    | {
        state: "running";
        version: string;
        date: string;
        vulnerabilities: RuntimeReportTest | null;
        secrets: RuntimeReportTest | null;
      }
    | { state: "notRunning" }
  );

/** The runtime tests of a namespace carry the tags of its namespace product. */
export function namespaceTags({ clusterName, namespace }: Pick<CodebaseEnvironment, "clusterName" | "namespace">) {
  return [formatTag(TAG_KEY.cluster, clusterName), formatTag(TAG_KEY.namespace, namespace)];
}

export function runtimeTestsFilter(
  environment: Pick<CodebaseEnvironment, "clusterName" | "namespace" | "applicationName">,
  container?: { workload: string; container: string; reportKind: RuntimeReportKind }
): DefectDojoTestsFilter {
  return {
    tags: [
      ...namespaceTags(environment),
      formatTag(TAG_KEY.app, environment.applicationName),
      ...(container === undefined
        ? []
        : [
            formatTag(TAG_KEY.workload, container.workload),
            formatTag(TAG_KEY.container, container.container),
            formatTag(TAG_KEY.reportKind, container.reportKind),
          ]),
    ],
  };
}

function isRuntimeReportKind(value: string | null): value is RuntimeReportKind {
  return RUNTIME_REPORT_KINDS.some((reportKind) => reportKind === value);
}

function replaces(candidate: DefectDojoTest, kept: DefectDojoTest): boolean {
  if (candidate.closed !== kept.closed) {
    return kept.closed;
  }
  return isNewer({ date: candidate.updated, testId: candidate.id }, { date: kept.updated, testId: kept.id });
}

function toReportTest(test: DefectDojoTest | undefined): RuntimeReportTest | null {
  return test === undefined || test.closed ? null : { testId: test.id, testUrl: test.url };
}

interface ContainerTests {
  workload: string;
  container: string;
  kept: Partial<Record<RuntimeReportKind, DefectDojoTest>>;
}

function toEntry(
  { workload, container, kept }: ContainerTests,
  isOwnImage: (image: string | null) => boolean
): RuntimeContainerEntry {
  const tests = RUNTIME_REPORT_KINDS.flatMap((reportKind) => kept[reportKind] ?? []);
  const open = tests.filter((test) => !test.closed);
  const tagOf = (key: TagKey) =>
    (open.length > 0 ? open : tests).map((test) => tagValue(test.tags, key)).find((value) => value !== null) ?? null;
  const image = tagOf(TAG_KEY.ociImage);
  const base = {
    workload,
    container,
    image,
    ownImage: isOwnImage(image),
    productUrl: tests[0].product.url,
    app: tagOf(TAG_KEY.app),
  };

  const date = latestDate(open.map((test) => test.updated));
  if (date === null) {
    return { ...base, state: "notRunning" };
  }

  return {
    ...base,
    state: "running",
    version: open[0].version,
    date,
    vulnerabilities: toReportTest(kept.vulnerabilityreport),
    secrets: toReportTest(kept.exposedsecretreport),
  };
}

/**
 * A container with an open test is running; with only closed tests it is not running, and carries neither tests,
 * version nor date. Ordered running first, then own image, then workload, then container.
 */
export function buildRuntimeContainers(
  tests: readonly DefectDojoTest[],
  isOwnImage: (image: string | null) => boolean = () => false
): RuntimeContainerEntry[] {
  const containers = new Map<string, ContainerTests>();

  for (const test of tests) {
    const workload = tagValue(test.tags, TAG_KEY.workload);
    const container = tagValue(test.tags, TAG_KEY.container);
    const reportKind = tagValue(test.tags, TAG_KEY.reportKind);
    if (test.level !== "runtime" || workload === null || container === null || !isRuntimeReportKind(reportKind)) {
      continue;
    }

    const key = JSON.stringify([workload, container]);
    const entry = containers.get(key) ?? { workload, container, kept: {} };
    const kept = entry.kept[reportKind];
    if (kept === undefined || replaces(test, kept)) {
      entry.kept[reportKind] = test;
    }
    containers.set(key, entry);
  }

  const isRunning = (entry: RuntimeContainerEntry) => entry.state === "running";

  return [...containers.values()]
    .map((entry) => toEntry(entry, isOwnImage))
    .sort(
      (a, b) =>
        Number(isRunning(b)) - Number(isRunning(a)) ||
        Number(b.ownImage) - Number(a.ownImage) ||
        a.workload.localeCompare(b.workload) ||
        a.container.localeCompare(b.container)
    );
}
