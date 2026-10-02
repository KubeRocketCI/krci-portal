import { pipelineRunAnnotations, pipelineRunQueueCancelReason } from "../../annotations.js";
import { pipelineRunPhase, pipelineRunSpecStatus, pipelineRunStopSkipReason } from "../../constants.js";
import { PipelineRun, PipelineRunStopSkipReason } from "../../types.js";
import { getPipelineRunStatus } from "../getPipelineRunStatus/index.js";

/** JSON merge patch body. Carries no `resourceVersion`. */
export interface PipelineRunStopPatch {
  metadata: { annotations: Record<string, string> };
  spec: { status: typeof pipelineRunSpecStatus.CancelledRunFinally };
}

export type PipelineRunStopPlan =
  | { action: "patch"; patch: PipelineRunStopPatch }
  | { action: "skip"; reason: PipelineRunStopSkipReason };

const stopRequestedSpecStatuses: ReadonlySet<string> = new Set([
  pipelineRunSpecStatus.Cancelled,
  pipelineRunSpecStatus.CancelledRunFinally,
  pipelineRunSpecStatus.StoppedRunFinally,
]);

/**
 * Decides how to stop a PipelineRun.
 *
 * - Runs in the `cancelling` phase skip as `already_stopping`.
 * - Runs in any other phase except `in-progress` skip as `already_done`; history runs land here.
 * - Runs whose `spec.status` already requests a stop skip as `already_stopping`; the `Succeeded`
 *   condition lags behind the patch.
 * - Every other run, pending included, is patched to `CancelledRunFinally`; `Cancelled` skips
 *   `finally` and with it the `*-set-status` VCS commit status report.
 * - The cancel-reason annotation and `spec.status` share one patch; TaskRun pods copy annotations
 *   at creation.
 */
export function planPipelineRunStop(pipelineRun: PipelineRun): PipelineRunStopPlan {
  const { phase } = getPipelineRunStatus(pipelineRun);

  if (phase === pipelineRunPhase.cancelling) {
    return { action: "skip", reason: pipelineRunStopSkipReason.already_stopping };
  }

  if (phase !== pipelineRunPhase["in-progress"]) {
    return { action: "skip", reason: pipelineRunStopSkipReason.already_done };
  }

  if (stopRequestedSpecStatuses.has(pipelineRun.spec?.status ?? "")) {
    return { action: "skip", reason: pipelineRunStopSkipReason.already_stopping };
  }

  return {
    action: "patch",
    patch: {
      metadata: {
        annotations: { [pipelineRunAnnotations.queueCancelReason]: pipelineRunQueueCancelReason.userCancelled },
      },
      spec: { status: pipelineRunSpecStatus.CancelledRunFinally },
    },
  };
}

/** True for a run that `planPipelineRunStop` would patch. */
export const isPipelineRunStoppable = (pipelineRun: PipelineRun): boolean =>
  planPipelineRunStop(pipelineRun).action === "patch";
