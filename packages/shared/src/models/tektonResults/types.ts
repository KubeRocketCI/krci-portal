/**
 * Tekton Results API Types
 * Based on OpenAPI spec: https://github.com/tektoncd/results/blob/main/docs/api/openapi.yaml
 */

// Status enum for Results
export type TektonResultStatus = "UNKNOWN" | "SUCCESS" | "FAILURE" | "TIMEOUT" | "CANCELLED";

// RecordSummary - high level overview of a Record
export interface TektonResultSummary {
  record: string;
  type: string;
  status: TektonResultStatus;
  start_time?: string;
  end_time?: string;
  annotations?: Record<string, unknown>;
}

// Result - aggregator of Records
export interface TektonResult {
  uid: string;
  name: string;
  create_time: string;
  update_time: string;
  summary?: TektonResultSummary;
  annotations?: Record<string, unknown>;
  etag?: string;
}

// List Results Response
export interface TektonResultsListResponse {
  results: TektonResult[];
  next_page_token: string;
}

// Record data type
export interface TektonResultRecordData {
  type: string;
  value: string; // Base64 encoded JSON
}

// Record - individual instance of data (PipelineRun, TaskRun, Log)
export interface TektonResultRecord {
  uid: string;
  name: string;
  create_time: string;
  update_time: string;
  etag?: string;
  data: TektonResultRecordData;
}

// List Records Response
export interface TektonRecordsListResponse {
  records: TektonResultRecord[];
  next_page_token: string;
}

// Query parameters for listing results
export interface TektonResultsQueryParams {
  filter?: string;
  pageSize?: number;
  pageToken?: string;
  orderBy?: string;
}

// PipelineRun metadata from decoded record data
export interface DecodedPipelineRunMetadata {
  name: string;
  namespace: string;
  uid: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  creationTimestamp?: string;
  resourceVersion?: string;
  generation?: number;
}

// PipelineRun condition
export interface DecodedPipelineRunCondition {
  type: string;
  status: string;
  reason?: string;
  message?: string;
  lastTransitionTime?: string;
}

// Child reference to TaskRun
export interface DecodedChildReference {
  kind: string;
  name: string;
  apiVersion: string;
  pipelineTaskName: string;
}

// PipelineRun status from decoded record data
export interface DecodedPipelineRunStatus {
  conditions?: DecodedPipelineRunCondition[];
  startTime?: string;
  completionTime?: string;
  childReferences?: DecodedChildReference[];
  pipelineSpec?: DecodedPipelineSpec;
}

// Pipeline task definition
export interface DecodedPipelineTask {
  name: string;
  taskRef?: { name: string; kind?: string };
  taskSpec?: {
    steps?: Array<{
      name: string;
      image: string;
      script?: string;
      command?: string[];
      args?: string[];
    }>;
  };
  params?: Array<{ name: string; value: string | string[] }>;
  runAfter?: string[];
  workspaces?: Array<{ name: string; workspace: string }>;
  when?: Array<{ input: string; operator: string; values: string[] }>;
}

// Pipeline spec
export interface DecodedPipelineSpec {
  tasks?: DecodedPipelineTask[];
  finally?: DecodedPipelineTask[];
  params?: Array<{ name: string; type?: string; default?: string | string[] }>;
  workspaces?: Array<{ name: string; optional?: boolean }>;
}

// PipelineRun spec
export interface DecodedPipelineRunSpec {
  pipelineRef?: { name: string };
  pipelineSpec?: DecodedPipelineSpec;
  params?: Array<{ name: string; value: string | string[] }>;
  workspaces?: Array<{ name: string; [key: string]: unknown }>;
  serviceAccountName?: string;
  timeout?: string;
  taskRunTemplate?: { serviceAccountName?: string };
}

// Full decoded PipelineRun structure
export interface DecodedPipelineRun {
  apiVersion: string;
  kind: string;
  metadata: DecodedPipelineRunMetadata;
  spec: DecodedPipelineRunSpec;
  status: DecodedPipelineRunStatus;
}

// Decoded Log record from Tekton Results
export interface DecodedLogRecord {
  status?: {
    isStored?: boolean;
    size?: number;
    errorOnStoreMsg?: string;
  };
}

// =============================================================================
// Summary API Types
// Based on: https://github.com/tektoncd/results/blob/main/docs/api/summary-api.md
// =============================================================================

/**
 * Single summary item from aggregation response
 * Contains aggregated metrics for a group (or overall if no grouping)
 */
export interface TektonSummaryItem {
  /** Total number of records */
  total?: number;
  /** Number of records with 'Succeeded' status */
  succeeded?: number;
  /** Number of records with 'Failed' status */
  failed?: number;
  /** Number of records with 'Cancelled' status */
  cancelled?: number;
  /** Number of records with 'Running' status */
  running?: number;
  /** Number of records with other statuses */
  others?: number;
  /** Average duration in HH:mm:SS.ms format */
  avg_duration?: string;
  /** Minimum duration in HH:mm:SS.ms format */
  min_duration?: string;
  /** Maximum duration in HH:mm:SS.ms format */
  max_duration?: string;
  /** Total duration in HH:mm:SS.ms format */
  total_duration?: string;
  /** Last runtime in Unix seconds */
  last_runtime?: number;
  /** Group value when using group_by parameter */
  group_value?: string | number;
}

/**
 * Summary API response
 */
export interface TektonSummaryResponse {
  summary: TektonSummaryItem[];
}

/**
 * Query parameters for Summary API endpoint
 *
 * @see https://github.com/tektoncd/results/blob/main/docs/api/summary-api.md
 */
export interface TektonSummaryQueryParams {
  /**
   * Comma-separated list of metrics to return.
   * If not specified, only "total" is returned.
   *
   * Valid values: total, succeeded, failed, cancelled, running, others,
   *               avg_duration, min_duration, max_duration, total_duration, last_runtime
   *
   * @example "total,succeeded,failed,avg_duration"
   */
  summary?: string;

  /**
   * Group results by time period or field.
   *
   * Time-based (returns group_value as Unix seconds):
   * - minute, hour, day, week, month, year
   *
   * Field-based (returns group_value as string):
   * - pipeline (format: "namespace/pipeline-name")
   * - namespace
   * - repository (format: "namespace/repository-name")
   *
   * Time-based groups can specify a time field:
   * - "hour" (uses creationTimestamp, default)
   * - "hour startTime" (uses status.startTime)
   * - "day completionTime" (uses status.completionTime)
   *
   * @example "hour"
   * @example "day startTime"
   * @example "pipeline"
   */
  groupBy?: string;

  /**
   * CEL filter expression for records.
   *
   * @example "data_type == 'tekton.dev/v1.PipelineRun'"
   * @example "data.status.startTime > timestamp('2024-01-01T00:00:00Z')"
   */
  filter?: string;

  /**
   * Order results by a summary field. Requires group_by to be set.
   * Format: "field_name ASC|DESC"
   * Field must be included in the summary parameter.
   *
   * @example "total DESC"
   * @example "asc running"
   */
  orderBy?: string;
}
