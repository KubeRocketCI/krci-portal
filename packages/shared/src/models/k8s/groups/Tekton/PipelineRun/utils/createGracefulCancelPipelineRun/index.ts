import { pipelineRunAnnotations, pipelineRunQueueCancelReason } from "../../annotations.js";
import { pipelineRunSpecStatus } from "../../constants.js";
import { PipelineRun } from "../../types.js";

/**
 * Cancels gracefully (`CancelledRunFinally`) rather than hard (`Cancelled`):
 * Tekton short-circuits `Cancelled` runs before `finally` tasks execute, so the
 * `*-set-status` finally task never reports the VCS commit status and the MR
 * check is left stuck "in progress" forever.
 *
 * The reason annotation must land in the SAME patch as `spec.status` — Tekton
 * copies PipelineRun annotations down to TaskRun pods at pod-creation time, so a
 * later patch would race the finally pod and the reporter would see no reason,
 * unable to tell a user stop from a `tekton-pipeline-queue` supersede.
 */
export function createGracefulCancelPipelineRun(pipelineRun: PipelineRun): PipelineRun {
  const newPipelineRun = structuredClone(pipelineRun);

  newPipelineRun.spec.status = pipelineRunSpecStatus.CancelledRunFinally;
  newPipelineRun.metadata.annotations = {
    ...newPipelineRun.metadata.annotations,
    [pipelineRunAnnotations.queueCancelReason]: pipelineRunQueueCancelReason.userCancelled,
  };

  return newPipelineRun;
}
