import { K8sResourceConfig } from "../../../common/index.js";
import {
  reasonSchema,
  taskRunPhaseEnum,
  taskRunStepReasonFieldNameEnum,
  taskRunStepStatusFieldNameEnum,
} from "./schema.js";

export const k8sTaskRunConfig = {
  apiVersion: "tekton.dev/v1",
  version: "v1",
  kind: "TaskRun",
  group: "tekton.dev",
  singularName: "taskrun",
  pluralName: "taskruns",
} as const satisfies K8sResourceConfig;

export const taskRunStatusReason = reasonSchema.enum;
export const taskRunPhase = taskRunPhaseEnum.enum;

/** False-status reasons that mean cancelled, not failed. `customruncancelled` is the CustomRun spelling. */
export const taskRunCancelledReasons: readonly string[] = [
  taskRunStatusReason.taskruncancelled,
  taskRunStatusReason.customruncancelled,
];

export const isTaskRunCancelledReason = (reason: string | undefined): boolean =>
  reason !== undefined && taskRunCancelledReasons.includes(reason);
export const taskRunStepStatusFieldName = taskRunStepStatusFieldNameEnum.enum;
export const taskRunStepStatusReason = taskRunStepReasonFieldNameEnum.enum;
