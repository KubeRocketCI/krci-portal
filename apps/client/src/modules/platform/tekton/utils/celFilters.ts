import { tektonResultAnnotations } from "@my-project/shared";

export const buildPipelineFilter = (pipelineName: string): string => {
  return `data.metadata.labels['${tektonResultAnnotations.pipeline}'] == '${pipelineName}' && data_type == 'tekton.dev/v1.PipelineRun'`;
};

export const buildPipelineRunNameFilter = (pipelineRunName: string): string => {
  return `data.metadata.name == '${pipelineRunName}' && data_type == 'tekton.dev/v1.PipelineRun'`;
};

export const buildStageFilter = (stageLabel: string): string => {
  return `data.metadata.labels['${tektonResultAnnotations.stage}'] == '${stageLabel}' && data_type == 'tekton.dev/v1.PipelineRun'`;
};

export const buildCodebaseFilter = (codebaseName: string): string => {
  return `data.metadata.labels['${tektonResultAnnotations.codebase}'] == '${codebaseName}' && data_type == 'tekton.dev/v1.PipelineRun'`;
};
