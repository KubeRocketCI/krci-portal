import { PipelineRunStopResult } from "../../types.js";

/** Number of runs per stop result. */
export function summarizePipelineRunStop(
  outcomes: readonly { result: PipelineRunStopResult }[]
): Record<PipelineRunStopResult, number> {
  const summary: Record<PipelineRunStopResult, number> = { stopping: 0, skipped: 0, failed: 0 };
  for (const { result } of outcomes) {
    summary[result]++;
  }
  return summary;
}
