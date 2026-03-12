import type { Application, Stage } from "@my-project/shared";

export interface PipelineDeployment {
  pipelineName: string;
  namespace: string;
  argoApps: Map<string, Application>; // stageName -> Application
  stages: Stage[];
}
