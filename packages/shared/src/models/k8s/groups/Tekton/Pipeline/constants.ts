import { K8sResourceConfig } from "../../../common/index.js";
import { pipelineTypeEnum } from "./schema.js";
import { pipelineLabels } from "./labels.js";

export const k8sPipelineConfig = {
  apiVersion: "tekton.dev/v1",
  version: "v1",
  kind: "Pipeline",
  group: "tekton.dev",
  singularName: "pipeline",
  pluralName: "pipelines",
} as const satisfies K8sResourceConfig<typeof pipelineLabels>;

export const pipelineType = pipelineTypeEnum.enum;
