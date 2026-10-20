export const pipelineRunAnnotations = {
  /**
   * Read by edp-tekton's `*-set-status` finally task via the Kubernetes downward
   * API: "superseded" renders specially, any other non-empty value as a generic
   * "CANCELED". Must be stripped on rerun (see `createRerunPipelineRun`) or a
   * stale value disguises a genuine failure as a cancellation.
   */
  queueCancelReason: "app.edp.epam.com/queue-cancel-reason",
  /**
   * Set to "true" once the run has been reported. Must be stripped on rerun
   * (see `createRerunPipelineRun`) or the new run is not reported.
   */
  pipelineReported: "app.edp.epam.com/pipeline-reported",
} as const;

/**
 * The portal only ever writes `userCancelled`; `superseded` is owned and written
 * by tekton-pipeline-queue and is listed here for the read side.
 */
export const pipelineRunQueueCancelReason = {
  userCancelled: "user-cancelled",
  superseded: "superseded",
} as const;
