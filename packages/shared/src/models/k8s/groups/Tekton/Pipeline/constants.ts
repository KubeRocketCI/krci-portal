import { K8sResourceConfig } from "../../../core";
import { pipelineTypeEnum } from "./schema";

export const pipelineLabels = {
  pipelineType: "app.edp.epam.com/pipelinetype",
  triggerTemplate: "app.edp.epam.com/triggertemplate",
} as const;

export const k8sPipelineConfig = {
  apiVersion: "tekton.dev/v1",
  version: "v1",
  kind: "Pipeline",
  group: "tekton.dev",
  singularName: "pipeline",
  pluralName: "pipelines",
} as const satisfies K8sResourceConfig<typeof pipelineLabels>;

export const pipelineType = pipelineTypeEnum.enum;
