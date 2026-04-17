import { K8sResourceConfig } from "../../../common/index.js";
import { pipelineRunReasonEnum, pipelineRunSpecStatusEnum, pipelineRunStatusEnum } from "./schema.js";
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
