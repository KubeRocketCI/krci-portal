// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
// Joins of the Environment view. Every join is an exact match on an explicit value.
import {
  PROTOTYPE_DEFECTDOJO_TAG_KEY,
  type PrototypeDefectDojoReportKind,
  type PrototypeDefectDojoScopeCounts,
  type PrototypeDefectDojoSeverityCounts,
  type PrototypeDefectDojoTest,
} from "@my-project/shared";
import { getTagValue, isTestNotRunning } from "@/modules/platform/security/prototype-defectdojo/utils";
import type { EnvironmentScope, RuntimeWorkload } from "./types";

/** Tags of the namespace product and of the Runtime tests of an Environment. */
export function environmentTags(environment: EnvironmentScope): string[] {
  return [
    `${PROTOTYPE_DEFECTDOJO_TAG_KEY.cluster}:${environment.clusterName}`,
    `${PROTOTYPE_DEFECTDOJO_TAG_KEY.namespace}:${environment.namespace}`,
  ];
}

/**
 * Workload containers of an Environment from its Runtime tests.
 * A container with a running test drops its closed tests; one with closed tests only is not running.
 * The codebase of a container is the one of the Application named by its `app` tag.
 */
export function buildRuntimeWorkloads(
  environment: EnvironmentScope,
  tests: PrototypeDefectDojoTest[]
): RuntimeWorkload[] {
  const codebaseByApplication = new Map(
    environment.applications.map((application) => [application.applicationName.toLowerCase(), application.codebaseName])
  );
  const workloads = new Map<string, RuntimeWorkload>();

  for (const test of tests) {
    if (test.level !== "runtime") {
      continue;
    }

    const workload = getTagValue(test.tags, PROTOTYPE_DEFECTDOJO_TAG_KEY.workload);
    const container = getTagValue(test.tags, PROTOTYPE_DEFECTDOJO_TAG_KEY.container);
    const appTag = getTagValue(test.tags, PROTOTYPE_DEFECTDOJO_TAG_KEY.app);
    const key = `${workload}|${container}`;

    const existing = workloads.get(key);
    if (existing) {
      existing.tests.push(test);
      continue;
    }

    workloads.set(key, {
      key,
      workload,
      container,
      imageName: getTagValue(test.tags, PROTOTYPE_DEFECTDOJO_TAG_KEY.ociImage),
      version: test.version,
      appTag,
      codebaseName: appTag === null ? null : (codebaseByApplication.get(appTag) ?? null),
      notRunning: false,
      tests: [test],
    });
  }

  for (const workload of workloads.values()) {
    const running = workload.tests.filter((test) => !isTestNotRunning(test));
    workload.notRunning = running.length === 0;
    if (running.length > 0) {
      workload.tests = running;
      workload.version = running[0].version;
    }
  }

  // Running first, then workloads of a codebase, then by name.
  return [...workloads.values()].sort(
    (left, right) =>
      Number(left.notRunning) - Number(right.notRunning) ||
      Number(left.codebaseName === null) - Number(right.codebaseName === null) ||
      left.key.localeCompare(right.key)
  );
}

/** The test of a report kind of a workload container. */
export function workloadTest(
  workload: RuntimeWorkload,
  reportKind: PrototypeDefectDojoReportKind
): PrototypeDefectDojoTest | null {
  return workload.tests.find((test) => test.reportKind === reportKind) ?? null;
}

/** Active counts of a test. `null`: no count for the test (closed test, or not loaded). */
export function testCounts(
  counts: Map<number, PrototypeDefectDojoScopeCounts>,
  test: PrototypeDefectDojoTest | null
): PrototypeDefectDojoSeverityCounts | null {
  return test ? (counts.get(test.id)?.active ?? null) : null;
}

/** Display name of a workload container: the workload tag value and the container. */
export function workloadLabel(workload: RuntimeWorkload): string {
  return `${workload.workload ?? "unknown workload"} / ${workload.container ?? "unknown container"}`;
}
