import { getPipelineRunStatus, PipelineRun, PipelineRunPhase } from "@my-project/shared";

// Active first, then problems, then done.
const PHASE_RANK = {
  "in-progress": 0,
  cancelling: 1,
  failed: 2,
  cancelled: 3,
  succeeded: 4,
  unknown: 5,
} satisfies Record<PipelineRunPhase, number>;

/** Sorts PipelineRuns by phase rank, not by their raw condition string. */
export const comparePipelineRunPhase = (a: PipelineRun, b: PipelineRun): number =>
  PHASE_RANK[getPipelineRunStatus(a).phase] - PHASE_RANK[getPipelineRunStatus(b).phase];
