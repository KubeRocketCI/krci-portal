import { K8sResourceConfig } from "../../../core";
import { pipelineRunReasonEnum, pipelineRunStatusEnum } from "./schema";
import { pipelineRunLabels } from "./labels";

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
