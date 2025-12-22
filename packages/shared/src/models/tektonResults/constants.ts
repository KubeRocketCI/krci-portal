/**
 * Tekton Results Summary API Constants
 *
 * Shareable constants for filtering, grouping, and querying
 * Tekton Results Summary API data.
 *
 * @see https://github.com/tektoncd/results/blob/main/docs/api/summary-api.md
 */

/**
 * Pipeline type filter values
 * Used with label: app.edp.epam.com/pipelinetype
 */
export const PIPELINE_TYPES = {
  BUILD: "build",
  REVIEW: "review",
  DEPLOY: "deploy",
} as const;

export type TektonResultsPipelineType = (typeof PIPELINE_TYPES)[keyof typeof PIPELINE_TYPES];

/**
 * Time range options for metrics queries (application-level, not API)
 * All ranges calculate from start of the period (not rolling window)
 */
export const TIME_RANGES = {
  TODAY: "today",
  WEEK: "7d",
  MONTH: "30d",
  QUARTER: "90d",
} as const;

export type TimeRange = (typeof TIME_RANGES)[keyof typeof TIME_RANGES];

/**
 * Summary metrics available from Tekton Results Summary API
 *
 * @see aggregator.go summaryFuncs map
 */
export const SUMMARY_METRICS = {
  /** Total number of records */
  TOTAL: "total",
  /** Number of records with 'Succeeded' or 'Completed' status */
  SUCCEEDED: "succeeded",
  /** Number of records with 'Failed' status */
  FAILED: "failed",
  /** Number of records with 'Cancelled' status */
  CANCELLED: "cancelled",
  /** Number of records with 'Running' status */
  RUNNING: "running",
  /** Number of records with other statuses */
  OTHERS: "others",
  /** Average duration in HH:mm:SS.ms format */
  AVG_DURATION: "avg_duration",
  /** Minimum duration in HH:mm:SS.ms format */
  MIN_DURATION: "min_duration",
  /** Maximum duration in HH:mm:SS.ms format */
  MAX_DURATION: "max_duration",
  /** Total/sum duration in HH:mm:SS.ms format */
  TOTAL_DURATION: "total_duration",
  /** Last runtime as Unix timestamp (seconds) */
  LAST_RUNTIME: "last_runtime",
} as const;

export type SummaryMetric = (typeof SUMMARY_METRICS)[keyof typeof SUMMARY_METRICS];

/**
 * Group by options for Summary API aggregations
 *
 * Time-based grouping returns group_value as Unix seconds.
 * Field-based grouping returns group_value as string.
 *
 * Time-based groups can optionally specify a time field:
 * - "hour" (uses creationTimestamp by default)
 * - "hour startTime" (uses status.startTime)
 * - "day completionTime" (uses status.completionTime)
 *
 * @see aggregator.go validGroups map
 */
export const GROUP_BY = {
  // Time-based grouping (returns Unix seconds as group_value)
  MINUTE: "minute",
  HOUR: "hour",
  DAY: "day",
  WEEK: "week",
  MONTH: "month",
  YEAR: "year",
  // Field-based grouping (returns string as group_value)
  PIPELINE: "pipeline",
  NAMESPACE: "namespace",
  REPOSITORY: "repository",
} as const;

export type GroupBy = (typeof GROUP_BY)[keyof typeof GROUP_BY];

/**
 * Time-based group by options (subset that returns numeric group_value)
 */
export const TIME_GROUP_BY = {
  MINUTE: GROUP_BY.MINUTE,
  HOUR: GROUP_BY.HOUR,
  DAY: GROUP_BY.DAY,
  WEEK: GROUP_BY.WEEK,
  MONTH: GROUP_BY.MONTH,
  YEAR: GROUP_BY.YEAR,
} as const;

export type TimeGroupBy = (typeof TIME_GROUP_BY)[keyof typeof TIME_GROUP_BY];

/**
 * Field-based group by options (subset that returns string group_value)
 */
export const FIELD_GROUP_BY = {
  PIPELINE: GROUP_BY.PIPELINE,
  NAMESPACE: GROUP_BY.NAMESPACE,
  REPOSITORY: GROUP_BY.REPOSITORY,
} as const;

export type FieldGroupBy = (typeof FIELD_GROUP_BY)[keyof typeof FIELD_GROUP_BY];

/**
 * Time fields that can be used with time-based grouping
 * Example: "hour startTime" or "day completionTime"
 */
export const GROUP_BY_TIME_FIELDS = {
  START_TIME: "startTime",
  COMPLETION_TIME: "completionTime",
} as const;

export type GroupByTimeField = (typeof GROUP_BY_TIME_FIELDS)[keyof typeof GROUP_BY_TIME_FIELDS];

/**
 * Record type identifiers for filtering
 * Note: The Summary API requires the full type URL format.
 */
export const RECORD_TYPES = {
  PIPELINE_RUN: "tekton.dev/v1.PipelineRun",
} as const;

export type RecordType = (typeof RECORD_TYPES)[keyof typeof RECORD_TYPES];

/**
 * Default metrics to fetch for dashboard overview
 */
export const DEFAULT_SUMMARY_METRICS = [
  SUMMARY_METRICS.TOTAL,
  SUMMARY_METRICS.SUCCEEDED,
  SUMMARY_METRICS.FAILED,
  SUMMARY_METRICS.CANCELLED,
  SUMMARY_METRICS.RUNNING,
  SUMMARY_METRICS.AVG_DURATION,
  SUMMARY_METRICS.MIN_DURATION,
  SUMMARY_METRICS.MAX_DURATION,
].join(",");

/**
 * Labels used for filtering Tekton Results
 * These correspond to PipelineRun labels that are indexed in Results API
 */
export const TEKTON_RESULT_LABELS = {
  PIPELINE_TYPE: "app.edp.epam.com/pipelinetype",
  CODEBASE: "app.edp.epam.com/codebase",
} as const;
