// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import type { PrototypeDefectDojoSeverity } from "@my-project/shared";
import { PROTOTYPE_SEVERITY_KEYS } from "@/modules/platform/security/prototype-defectdojo/constants";
import { environmentLabel, testCounts, testLabel } from "./model";
import type { CodebaseFindingsModel, CodebaseFindingsScope, LevelModel, ScanTarget } from "./types";

/** One level of a codebase in one phrase, for the Overview line. */
export type LevelDigest =
  | { kind: "loading" }
  | { kind: "unreachable" }
  | { kind: "noData" }
  /** Runtime only: every workload container of the codebase is closed. */
  | { kind: "notRunning" }
  | { kind: "clean"; scans: number }
  | {
      kind: "findings";
      /** Highest severity that has findings in the picked scan. */
      severity: PrototypeDefectDojoSeverity;
      /** Findings of that severity in the picked scan. */
      count: number;
      /** Scanner of the picked scan. */
      scan: string;
      /** Runtime only: the Environment of the picked scan. */
      environment: string | null;
    };

/**
 * Digest of a level. Counts of scans are never added. The digest names one scan: the one whose
 * highest severity with findings is the most severe; between equals, the one with more findings
 * of that severity.
 */
export function levelDigest(level: LevelModel, targets: ScanTarget[], model: CodebaseFindingsModel): LevelDigest {
  if (level.state === "loading") return { kind: "loading" };
  if (level.state === "unreachable") return { kind: "unreachable" };
  if (targets.length === 0) return { kind: "noData" };

  const running = targets.filter((target) => !target.notRunning);
  if (running.length === 0) return { kind: "notRunning" };
  if (model.countsUnreachable) return { kind: "unreachable" };

  let best: Extract<LevelDigest, { kind: "findings" }> | null = null;
  let bestRank = PROTOTYPE_SEVERITY_KEYS.length;
  let scans = 0;

  for (const target of running) {
    for (const test of target.tests) {
      const counts = testCounts(model.counts, test.id);
      if (counts === null) {
        return { kind: "loading" };
      }
      scans += 1;

      const rank = PROTOTYPE_SEVERITY_KEYS.findIndex(({ key }) => counts[key] > 0);
      if (rank === -1) {
        continue;
      }
      const { severity, key } = PROTOTYPE_SEVERITY_KEYS[rank];
      if (rank < bestRank || (rank === bestRank && best !== null && counts[key] > best.count)) {
        bestRank = rank;
        best = {
          kind: "findings",
          severity,
          count: counts[key],
          scan: testLabel(test),
          environment: target.environment ? environmentLabel(target.environment) : null,
        };
      }
    }
  }

  return best ?? { kind: "clean", scans };
}

/**
 * Digests of the three levels of a codebase. Code and Image: the scans of the default branch
 * (the first branch of the scope). Runtime: the scans of every Environment.
 */
export function codebaseDigests(scope: CodebaseFindingsScope, model: CodebaseFindingsModel) {
  const defaultBranch = scope.branches[0];
  const ofDefaultBranch = (target: ScanTarget) => target.branch === defaultBranch;

  return {
    code: levelDigest(model.levels.code, model.levels.code.targets.filter(ofDefaultBranch), model),
    image: levelDigest(model.levels.image, model.levels.image.targets.filter(ofDefaultBranch), model),
    runtime: levelDigest(model.levels.runtime, model.levels.runtime.targets, model),
  };
}
