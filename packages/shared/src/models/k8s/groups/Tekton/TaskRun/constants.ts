import { K8sResourceConfig } from "../../../core";
import {
  taskRunStepReasonFieldNameEnum,
  taskRunStepStatusFieldNameEnum,
} from "./schema";

export const k8sTaskRunConfig = {
  apiVersion: "tekton.dev/v1",
  version: "v1",
  kind: "TaskRun",
  group: "tekton.dev",
  singularName: "taskrun",
  pluralName: "taskruns",
} as const satisfies K8sResourceConfig;

export const taskRunStepStatusFieldName = taskRunStepStatusFieldNameEnum.enum;
export const taskRunStepReasonFieldName = taskRunStepReasonFieldNameEnum.enum;