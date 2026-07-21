import { PipelineRun } from "../../types.js";
import { pipelineRunStatus, isPipelineRunCancelledReason } from "../../constants.js";
import { getPipelineRunStatus } from "../getPipelineRunStatus/index.js";

/**
 * Whether a PipelineRun is actively in progress (running / pending / finalizing).
 *
 * Mirrors the tektoncd/pipeline controller model: the single `Succeeded`
 * condition is set to status "Unknown" for the entire lifetime of a run that has
 * not reached a terminal state (see GetPipelineConditionStatus in
 * pkg/reconciler/pipelinerun/resources/pipelinerunstate.go), and to "True"/"False"
 * only once it finishes. So "in progress" is defined by status == "Unknown", NOT
 * by an allowlist of reasons — that keeps us correct for pending
 * (`PipelineRunPending`), finally-running, and any future reason Tekton adds.
 *
 * Two exclusions:
 * - Cancelled/stopped runs report "Unknown" transiently but are their own neutral
 *   category everywhere in the UI, so they are not "in progress".
 * - A reasonless "Unknown" is not a live run: the controller always sets a reason
 *   on an in-flight run, whereas an archived Tekton Results record with an
 *   unfinalized summary (see normalizeResultToPipelineRun) has status "Unknown"
 *   with no reason. Requiring a reason keeps those terminal records out.
 */
export const isPipelineRunInProgress = (pipelineRun: PipelineRun | undefined): boolean => {
  const { status, reason } = getPipelineRunStatus(pipelineRun);

  return status === pipelineRunStatus.unknown && reason !== undefined && !isPipelineRunCancelledReason(reason);
};
