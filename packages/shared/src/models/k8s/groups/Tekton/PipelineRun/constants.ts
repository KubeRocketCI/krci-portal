import { K8sResourceConfig } from "../../../core";

export const pipelineRunLabels = {
  parentPipelineRun: "app.edp.epam.com/parentPipelineRun",
  codebaseBranch: "app.edp.epam.com/codebasebranch",
  codebase: "app.edp.epam.com/codebase",
  pipelineType: "app.edp.epam.com/pipelinetype",
  pipeline: "app.edp.epam.com/pipeline",
  cdPipeline: "app.edp.epam.com/cdpipeline",
  stage: "app.edp.epam.com/stage",
} as const;

export const k8sPipelineRunConfig = {
  apiVersion: "tekton.dev/v1",
  version: "v1",
  kind: "PipelineRun",
  group: "tekton.dev",
  singularName: "pipelineRunrun",
  pluralName: "pipelineRunruns",
} as const satisfies K8sResourceConfig<typeof pipelineRunLabels>;
