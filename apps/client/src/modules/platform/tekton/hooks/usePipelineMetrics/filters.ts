/**
 * CEL Filter Builders for Tekton Results Summary API
 *
 * These utilities build CEL (Common Expression Language) filter expressions
 * that are used to query the Tekton Results API.
 */

import {
  TimeRange,
  TEKTON_RESULT_LABELS,
  RECORD_TYPES,
  TektonResultsPipelineType,
  getTimeRangeStartISO,
} from "@my-project/shared";

/**
 * Build time range filter based on selected range (UTC-aligned)
 *
 * Uses shared utility for consistent UTC time boundaries across all components.
 * For Records/Summary API, we use data.status.startTime for time filtering
 * as create_time is not available for Records CEL filtering.
 *
 * @param timeRange - Selected time range
 * @returns CEL filter expression for time range
 */
export const buildTimeRangeFilter = (timeRange: TimeRange): string => {
  const startDateIso = getTimeRangeStartISO(timeRange);
  return `data.status.startTime > timestamp('${startDateIso}')`;
};

/**
 * Build filter for specific pipeline type
 *
 * @param pipelineType - Pipeline type (build, review, deploy, clean)
 * @returns CEL filter expression
 */
export const buildPipelineTypeFilter = (pipelineType: TektonResultsPipelineType): string => {
  return `data.metadata.labels['${TEKTON_RESULT_LABELS.PIPELINE_TYPE}'] == '${pipelineType}'`;
};

/**
 * Build filter to only include PipelineRun records
 *
 * @returns CEL filter expression
 */
export const buildPipelineRunTypeFilter = (): string => {
  return `data_type == '${RECORD_TYPES.PIPELINE_RUN}'`;
};

/**
 * Build filter for specific codebase
 *
 * @param codebase - Codebase name
 * @returns CEL filter expression
 */
export const buildCodebaseFilter = (codebase: string): string => {
  return `data.metadata.labels['${TEKTON_RESULT_LABELS.CODEBASE}'] == '${codebase}'`;
};

/**
 * Combine multiple filter expressions with logical AND
 *
 * @param filters - Array of filter expressions (undefined values are filtered out)
 * @returns Combined CEL filter expression
 *
 * @example
 * combineFilters(
 *   buildPipelineRunTypeFilter(),
 *   buildTimeRangeFilter('today'),
 *   buildPipelineTypeFilter('build')
 * )
 * // Returns: "data_type == 'tekton.dev/v1.PipelineRun' && data.status.startTime > timestamp('...') && data.metadata.labels['...'] == 'build'"
 */
export const combineFilters = (...filters: (string | undefined | null)[]): string => {
  return filters.filter((f): f is string => Boolean(f)).join(" && ");
};
