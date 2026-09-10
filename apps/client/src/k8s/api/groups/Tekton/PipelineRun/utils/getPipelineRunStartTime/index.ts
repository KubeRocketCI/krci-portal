import { PipelineRun } from "@my-project/shared";

/**
 * When the run started, falling back to when it was created.
 *
 * Queued runs (`spec.status: PipelineRunPending`, held by tekton-pipeline-queue) carry no
 * `status.startTime` until their lane admits them. Empty strings count as absent: history
 * records adapted from Tekton Results default `creationTimestamp` to `""`.
 */
export const getPipelineRunStartTime = (pipelineRun: PipelineRun): string | undefined =>
  pipelineRun.status?.startTime || pipelineRun.metadata?.creationTimestamp || undefined;
