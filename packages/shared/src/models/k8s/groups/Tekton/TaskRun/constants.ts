import { K8sResourceConfig } from "../../../common/index.js";
import {
  reasonSchema,
  statusSchema,
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

export const taskRunStatus = statusSchema.enum;
export const taskRunStatusReason = reasonSchema.enum;
export const taskRunStepStatusFieldName = taskRunStepStatusFieldNameEnum.enum;
export const taskRunStepStatusReason = taskRunStepReasonFieldNameEnum.enum;
