// Shared across the Stage CR name, the PipelineRun `cdstage` label, and the per-stage ConfigMap name.
export const getStageResourceName = (cdPipeline: string, stage: string) => `${cdPipeline}-${stage}`;
