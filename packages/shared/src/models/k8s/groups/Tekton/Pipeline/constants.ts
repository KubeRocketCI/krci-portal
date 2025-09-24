import { K8sResourceConfig } from "../../../common";
import { pipelineTypeEnum } from "./schema";
import { pipelineLabels } from "./labels";

export const k8sPipelineConfig = {
  apiVersion: "tekton.dev/v1",
  version: "v1",
  kind: "Pipeline",
  group: "tekton.dev",
  singularName: "pipeline",
  pluralName: "pipelines",
} as const satisfies K8sResourceConfig<typeof pipelineLabels>;

export const pipelineType = pipelineTypeEnum.enum;
