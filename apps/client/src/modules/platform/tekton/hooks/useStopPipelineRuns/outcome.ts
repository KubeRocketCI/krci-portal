import type { RouterOutput } from "@my-project/trpc";

export type StopPipelineRunsOutput = RouterOutput["pipelineRun"]["stop"];
export type PipelineRunStopOutcome = StopPipelineRunsOutput["results"][number];

type PipelineRunStopReason = NonNullable<PipelineRunStopOutcome["reason"]>;

export const pipelineRunStopReasonLabels: Record<PipelineRunStopReason, string> = {
  already_done: "already finished",
  already_stopping: "already stopping",
  not_found: "not found",
  forbidden: "no permission",
  error: "Kubernetes API error",
};

/** One-line summary of per-run outcomes; names the run when there is only one. */
export const describeStopOutcome = ({ results, summary }: StopPipelineRunsOutput) => {
  if (results.length === 1) {
    const [{ name, result, reason }] = results;
    const reasonLabel = reason ? pipelineRunStopReasonLabels[reason] : "";

    if (result === "stopping") return `PipelineRun ${name} is stopping`;
    if (result === "skipped") return `PipelineRun ${name} was not stopped: ${reasonLabel}`;
    return `Failed to stop PipelineRun ${name}: ${reasonLabel}`;
  }

  return [
    `Stopping ${summary.stopping} of ${results.length} PipelineRuns`,
    summary.skipped ? `${summary.skipped} skipped` : "",
    summary.failed ? `${summary.failed} failed` : "",
  ]
    .filter(Boolean)
    .join(" · ");
};
