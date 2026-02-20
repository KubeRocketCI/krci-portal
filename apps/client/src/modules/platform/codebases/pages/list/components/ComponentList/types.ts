import type { CDPipeline, Codebase, Stage } from "@my-project/shared";

export type ComponentsToDeleteConflicts = Map<
  string,
  {
    component: Codebase;
    pipelines: CDPipeline[];
    stages: Stage[];
  }
>;

export type ComponentsToDelete = Map<string, Codebase>;
