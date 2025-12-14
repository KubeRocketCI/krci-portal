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
