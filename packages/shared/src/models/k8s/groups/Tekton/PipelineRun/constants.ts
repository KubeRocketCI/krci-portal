import { K8sResourceConfig } from "../../../common/index.js";
import { pipelineRunReasonEnum, pipelineRunSpecStatusEnum, pipelineRunStatusEnum } from "./schema.js";
import type { PipelineRunReason } from "./types.js";
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
export const pipelineRunStatus = pipelineRunStatusEnum.enum;
/** Values for PipelineRun spec.status — used to cancel or pause a run. */
export const pipelineRunSpecStatus = pipelineRunSpecStatusEnum.enum;

/**
 * Terminal/transitional reasons that mean a run was cancelled or stopped by a
 * user (or by the platform, e.g. edp-tekton superseding a review run) rather
 * than failing. Tekton reports these with condition status "False", so without
 * special-casing they would otherwise be rendered as failures.
 */
export const pipelineRunCancelledReasons: readonly PipelineRunReason[] = [
  pipelineRunReason.cancelled,
  pipelineRunReason.cancelledrunningfinally,
  pipelineRunReason.stoppedrunningfinally,
  pipelineRunReason.pipelinerunstopping,
];

export const isPipelineRunCancelledReason = (reason: PipelineRunReason | undefined): boolean =>
  reason !== undefined && pipelineRunCancelledReasons.includes(reason);

/**
 * Human-friendly label for a PipelineRun condition reason. Collapses the several
 * cancel/stop reasons into a single "Cancelled" label; other reasons fall back
 * to their raw value (callers typically capitalize it for display).
 */
export const getPipelineRunReasonLabel = (reason: PipelineRunReason | undefined): string => {
  if (isPipelineRunCancelledReason(reason)) {
    return "Cancelled";
  }

  return reason ?? "Unknown";
};
