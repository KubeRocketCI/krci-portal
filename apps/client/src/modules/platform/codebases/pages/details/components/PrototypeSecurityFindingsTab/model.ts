// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
// Joins of the codebase tab. Every join is an exact match on an explicit value.
import {
  PROTOTYPE_DEFECTDOJO_TAG_KEY,
  type PrototypeDefectDojoScopeCounts,
  type PrototypeDefectDojoSeverityCounts,
  type PrototypeDefectDojoTest,
} from "@my-project/shared";
import { getTagValue, isTestNotRunning } from "@/modules/platform/security/prototype-defectdojo/utils";
import type { CodebaseEnvironment, CodebaseFindingsScope, EnvironmentFocus, ScanTarget } from "./types";

/** Tags of the CI tests of a codebase: its name and the namespace of the Codebase object. */
export function ciTestTags(scope: CodebaseFindingsScope): string[] {
  return [
    `${PROTOTYPE_DEFECTDOJO_TAG_KEY.codebase}:${scope.codebaseName}`,
    `${PROTOTYPE_DEFECTDOJO_TAG_KEY.tenant}:${scope.namespace}`,
  ];
}

/** Tags of the Runtime tests of a codebase in one Environment. */
export function runtimeTestTags(environment: CodebaseEnvironment): string[] {
  return [
    `${PROTOTYPE_DEFECTDOJO_TAG_KEY.cluster}:${environment.clusterName}`,
    `${PROTOTYPE_DEFECTDOJO_TAG_KEY.namespace}:${environment.namespace}`,
    `${PROTOTYPE_DEFECTDOJO_TAG_KEY.app}:${environment.applicationName}`,
  ];
}

export function environmentKey(environment: CodebaseEnvironment): string {
  return `${environment.clusterName}|${environment.namespace}|${environment.applicationName}`;
}

/** Display label of an Environment: CD pipeline and Stage name. */
export function environmentLabel(environment: CodebaseEnvironment): string {
  return `${environment.cdPipeline} / ${environment.stage}`;
}

/** The Environment is the one a link asked the tab to put in focus. */
export function isFocusedEnvironment(environment: CodebaseEnvironment, focus: EnvironmentFocus | null): boolean {
  return focus !== null && environment.cdPipeline === focus.cdPipeline && environment.stage === focus.stage;
}

function addToTarget(targets: Map<string, ScanTarget>, target: ScanTarget, test: PrototypeDefectDojoTest) {
  const existing = targets.get(target.key);
  if (existing) {
    existing.tests.push(test);
    // Scanners of one image may report the tag unevenly; the first non-empty one names the target.
    existing.version = existing.version || target.version;
    return;
  }
  targets.set(target.key, { ...target, tests: [test] });
}

/**
 * Code and Image targets from the CI tests of the codebase.
 * A test whose `branch_tag` is not a branch of `scope.branches` is dropped.
 * An Image target is the codebase's own image when its `oci-image` tag equals an image name of the scope.
 */
export function buildCiTargets(scope: CodebaseFindingsScope, tests: PrototypeDefectDojoTest[]): ScanTarget[] {
  const targets = new Map<string, ScanTarget>();
  const ownImageNames = new Set(scope.ownImageNames.map((name) => name.toLowerCase()));

  for (const test of tests) {
    if (!scope.branches.includes(test.branchTag)) {
      continue;
    }

    if (test.level === "code") {
      addToTarget(
        targets,
        {
          key: `code|${test.branchTag}`,
          level: "code",
          title: "Source code",
          branch: test.branchTag,
          version: "",
          imageName: null,
          ownImage: false,
          environment: null,
          workload: null,
          container: null,
          notRunning: false,
          tests: [],
        },
        test
      );
    }

    if (test.level === "image") {
      const imageName = getTagValue(test.tags, PROTOTYPE_DEFECTDOJO_TAG_KEY.ociImage);
      addToTarget(
        targets,
        {
          key: `image|${test.branchTag}|${imageName ?? test.engagement.id}`,
          level: "image",
          title: imageName ?? test.engagement.name,
          branch: test.branchTag,
          version: test.version,
          imageName,
          ownImage: imageName !== null && ownImageNames.has(imageName),
          environment: null,
          workload: null,
          container: null,
          notRunning: false,
          tests: [],
        },
        test
      );
    }
  }

  // The codebase's own image leads its level.
  return [...targets.values()].sort((left, right) => Number(right.ownImage) - Number(left.ownImage));
}

/** Runtime targets of one Environment: one per workload container. */
export function buildRuntimeTargets(
  scope: CodebaseFindingsScope,
  environment: CodebaseEnvironment,
  tests: PrototypeDefectDojoTest[]
): ScanTarget[] {
  const targets = new Map<string, ScanTarget>();
  const ownImageNames = new Set(scope.ownImageNames.map((name) => name.toLowerCase()));

  for (const test of tests) {
    if (test.level !== "runtime") {
      continue;
    }

    const workload = getTagValue(test.tags, PROTOTYPE_DEFECTDOJO_TAG_KEY.workload);
    const container = getTagValue(test.tags, PROTOTYPE_DEFECTDOJO_TAG_KEY.container);
    const imageName = getTagValue(test.tags, PROTOTYPE_DEFECTDOJO_TAG_KEY.ociImage);

    addToTarget(
      targets,
      {
        key: `runtime|${environmentKey(environment)}|${workload}|${container}`,
        level: "runtime",
        title: workload ?? test.title,
        branch: null,
        version: test.version,
        imageName,
        ownImage: imageName !== null && ownImageNames.has(imageName),
        environment,
        workload,
        container,
        notRunning: false,
        tests: [],
      },
      test
    );
  }

  // A container with a running test drops its closed tests; one with closed tests only is not running.
  for (const target of targets.values()) {
    const running = target.tests.filter((test) => !isTestNotRunning(test));
    target.notRunning = running.length === 0;
    if (running.length > 0) {
      target.tests = running;
    }
  }

  return [...targets.values()].sort((left, right) => Number(left.notRunning) - Number(right.notRunning));
}

/** Scanner name of a CI test; the report kind of a Runtime test. */
export function testLabel(test: PrototypeDefectDojoTest): string {
  return test.level === "runtime" ? (test.reportKind ?? test.title) : test.scanType;
}

/** Active counts of a test. `null`: no count for the test. Counts of two tests are never added up. */
export function testCounts(
  counts: Map<number, PrototypeDefectDojoScopeCounts>,
  testId: number
): PrototypeDefectDojoSeverityCounts | null {
  return counts.get(testId)?.active ?? null;
}
