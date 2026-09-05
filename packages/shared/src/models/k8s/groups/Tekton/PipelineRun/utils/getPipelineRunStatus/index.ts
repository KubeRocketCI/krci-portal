import { PipelineRun, PipelineRunPhase, PipelineRunStatusResult } from "../../types.js";
import { isPipelineRunCancelledReason, isPipelineRunCancellingReason, pipelineRunPhase } from "../../constants.js";
import { isHistoryPipelineRun } from "../isHistoryPipelineRun/index.js";

/**
 * Classifies a PipelineRun's `Succeeded` condition into a coarse `phase`.
 * Status is authoritative. `reason` is consulted only within a status.
 * True with a cancel reason is still `succeeded`.
 * A live run with no condition is `in-progress`. Tekton's `IsDone` treats a
 * nil condition as Unknown.
 * An archived record (`isHistoryPipelineRun`) with Unknown is `unknown`.
 * Tekton Results could not map its summary.
 */
export const getPipelineRunStatus = (pipelineRun: PipelineRun | undefined): PipelineRunStatusResult => {
  const condition = pipelineRun?.status?.conditions?.find((c) => c.type === "Succeeded");
  const reason = condition?.reason?.toLowerCase();
  const message = condition?.message || "No message";
  const lastTransitionTime = condition?.lastTransitionTime;
  const startTime = pipelineRun?.status?.startTime;
  const completionTime = pipelineRun?.status?.completionTime;

  let phase: PipelineRunPhase;

  if (pipelineRun === undefined) {
    phase = pipelineRunPhase.unknown;
  } else if (condition === undefined) {
    phase = isHistoryPipelineRun(pipelineRun) ? pipelineRunPhase.unknown : pipelineRunPhase["in-progress"];
  } else {
    const status = condition.status?.toLowerCase();

    if (status === "true") {
      phase = pipelineRunPhase.succeeded;
    } else if (status === "false") {
      phase = isPipelineRunCancelledReason(reason) ? pipelineRunPhase.cancelled : pipelineRunPhase.failed;
    } else if (isHistoryPipelineRun(pipelineRun)) {
      phase = pipelineRunPhase.unknown;
    } else {
      phase =
        isPipelineRunCancellingReason(reason) || isPipelineRunCancelledReason(reason)
          ? pipelineRunPhase.cancelling
          : pipelineRunPhase["in-progress"];
    }
  }

  return {
    phase,
    reason,
    message,
    lastTransitionTime,
    startTime,
    completionTime,
  };
};
