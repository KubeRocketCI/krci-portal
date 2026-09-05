import { K8sResourceConfig } from "../../../common/index.js";
import {
  pipelineRunPhaseEnum,
  pipelineRunReasonEnum,
  pipelineRunSpecStatusEnum,
  pipelineRunStatusEnum,
} from "./schema.js";
import { pipelineRunLabels } from "./labels.js";

export const k8sPipelineRunConfig = {
  apiVersion: "tekton.dev/v1",
  version: "v1",
  kind: "PipelineRun",
  group: "tekton.dev",
  singularName: "pipelinerun",
  pluralName: "pipelineruns",
} as const satisfies K8sResourceConfig<typeof pipelineRunLabels>;

export const pipelineRunReason = pipelineRunReasonEnum.enum;
/**
 * Raw condition status. Internal to this folder; not exported from the package
 * barrel. Callers read `phase` from getPipelineRunStatus.
 */
export const pipelineRunStatus = pipelineRunStatusEnum.enum;
/** Values for PipelineRun spec.status — used to cancel or pause a run. */
export const pipelineRunSpecStatus = pipelineRunSpecStatusEnum.enum;
export const pipelineRunPhase = pipelineRunPhaseEnum.enum;

/**
 * Reasons for a condition status "False" that mean a run was cancelled by a
 * user (or by the platform, e.g. edp-tekton superseding a review run) rather
 * than failing. `pipelineruncancelled` is the reason pre-2019 Tekton used for
 * the same event.
 */
export const pipelineRunCancelledReasons: readonly string[] = [
  pipelineRunReason.cancelled,
  pipelineRunReason.pipelineruncancelled,
];

/**
 * Reasons for a condition status "Unknown" that mean a graceful cancel is
 * winding down (a `finally` task is still running). `pipelinerunstopping`
 * also fires on a plain task failure; it stays out of this family and
 * classifies as in-progress, not cancelling.
 */
export const pipelineRunCancellingReasons: readonly string[] = [
  pipelineRunReason.cancelledrunningfinally,
  pipelineRunReason.stoppedrunningfinally,
];

export const isPipelineRunCancelledReason = (reason: string | undefined): boolean =>
  reason !== undefined && pipelineRunCancelledReasons.includes(reason);

export const isPipelineRunCancellingReason = (reason: string | undefined): boolean =>
  reason !== undefined && pipelineRunCancellingReasons.includes(reason);

/** Reasons for an in-progress run that has not started executing yet. */
export const pipelineRunPendingReasons: readonly string[] = [
  pipelineRunReason.pipelinerunpending,
  pipelineRunReason.pending,
];

export const isPipelineRunPendingReason = (reason: string | undefined): boolean =>
  reason !== undefined && pipelineRunPendingReasons.includes(reason);

/**
 * Human-friendly labels for reasons whose raw (lowercased) value reads poorly when
 * capitalized for display, e.g. "pipelinerunpending" → "Pending". Reasons not listed
 * here fall back to their raw value, which already reads fine ("running", "failed").
 */
const pipelineRunReasonLabels: Record<string, string> = {
  [pipelineRunReason.pipelinerunstopping]: "Stopping",
  [pipelineRunReason.resolvingpipelineref]: "Resolving",
  [pipelineRunReason.resolvingtaskref]: "Resolving",
  [pipelineRunReason.pipelineruntimeoutrunningfinally]: "Finalizing",
  [pipelineRunReason.pipelineruntimeout]: "Timeout",
};

/**
 * Human-friendly label for a PipelineRun condition reason. The cancelled family
 * collapses to "Cancelled", the cancelling family to "Cancelling"; other known
 * reasons map to readable text; anything else falls back to the raw value, or
 * "Unknown" when the reason itself is undefined.
 */
export const getPipelineRunReasonLabel = (reason: string | undefined): string => {
  if (isPipelineRunCancelledReason(reason)) {
    return "Cancelled";
  }

  if (isPipelineRunCancellingReason(reason)) {
    return "Cancelling";
  }

  if (isPipelineRunPendingReason(reason)) {
    return "Pending";
  }

  if (reason && pipelineRunReasonLabels[reason]) {
    return pipelineRunReasonLabels[reason];
  }

  return reason ?? "Unknown";
};
