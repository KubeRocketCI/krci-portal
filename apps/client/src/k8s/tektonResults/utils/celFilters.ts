import { pipelineRunLabels } from "@my-project/shared";

/**
 * CEL Filter Utilities for Tekton Results API
 *
 * Builds CEL (Common Expression Language) filter expressions for the Results endpoint.
 * Note: Results endpoint uses `annotations` field, Records endpoint uses `data` field.
 *
 * @see https://github.com/tektoncd/results/blob/main/docs/api/README.md#filtering
 */

/**
 * Build CEL filter for pipeline name
 * Filters Results by the tekton.dev/pipeline annotation
 *
 * @param pipelineName - Name of the pipeline to filter by
 * @returns CEL filter expression
 *
 * @example
 * buildPipelineFilter("my-pipeline")
 * // Returns: "annotations['tekton.dev/pipeline'] == 'my-pipeline'"
 */
export const buildPipelineFilter = (pipelineName: string): string => {
  return `annotations['${pipelineRunLabels.pipeline}'] == '${pipelineName}'`;
};
