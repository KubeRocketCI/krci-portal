export interface GitFusionRepository {
  default_branch: string;
  description: string;
  id: string;
  name: string;
  owner: string;
  url: string;
}

export interface GitFusionRepositoryListResponse {
  data: GitFusionRepository[];
}

export interface GitFusionBranch {
  name: string;
}

export interface GitFusionBranchListResponse {
  data: GitFusionBranch[];
}

export interface GitFusionOrganization {
  name: string;
}

export interface GitFusionOrganizationListResponse {
  data: GitFusionOrganization[];
}

export interface GitFusionPullRequest {
  id: string;
  number: number;
  title: string;
  state: "open" | "closed" | "merged";
  author?: { id: string; name: string; avatar_url?: string };
  source_branch: string;
  target_branch: string;
  url: string;
  created_at: string;
  updated_at: string;
  description?: string;
  draft?: boolean;
  commit_sha?: string;
}

export interface GitFusionPullRequestListResponse {
  data: GitFusionPullRequest[];
  pagination: { page: number; per_page: number; total: number };
}

export interface GitLabPipelineVariable {
  key: string;
  value: string;
}

export interface GitLabPipelineTriggerData {
  gitServer: string;
  gitUrlPath: string;
  branchName: string;
  gitWebUrl?: string;
  variables: GitLabPipelineVariable[];
}

export interface GitLabPipelineResponse {
  id: number;
  project_id: number;
  ref: string;
  sha: string;
  status: string;
  web_url: string;
  created_at: string;
  updated_at: string;
}

/** Normalized CI/CD pipeline as returned by GitFusion's `GET /api/v1/pipelines` (provider-agnostic; GitLab today). */
export interface GitFusionPipeline {
  id: string; // string to accommodate non-numeric provider IDs
  project_id?: string;
  ref: string;
  sha: string;
  /** What triggered the pipeline (e.g. "push", "merge_request_event", "web", "other"). */
  source?: string;
  /** Normalized status — see GitFusionPipelineStatus. */
  status: string;
  created_at: string;
  updated_at?: string;
  web_url: string;
}

/** Normalized pipeline statuses GitFusion emits for a GitLab pipeline. */
export type GitFusionPipelineStatus =
  | "success"
  | "failed"
  | "running"
  | "pending"
  | "canceled"
  | "cancelled"
  | "skipped"
  | "manual"
  | "created"
  | "preparing"
  | "scheduled"
  | "waiting_for_resource"
  | "unknown";

export interface GitFusionPipelineListResponse {
  data: GitFusionPipeline[];
  pagination: { page: number; per_page: number; total: number };
}

/**
 * A single job within a pipeline, from GitFusion's `GET /api/v1/pipeline-jobs`. Jobs are
 * grouped by `stage` and each has its own log (trace).
 */
export interface GitFusionPipelineJob {
  id: string;
  name: string;
  stage: string;
  /** Provider-native status (e.g. success, failed, running, manual, skipped). */
  status: string;
  ref?: string;
  web_url?: string;
  allow_failure?: boolean;
  /** Job duration in seconds. */
  duration?: number;
  created_at?: string;
  started_at?: string;
  finished_at?: string;
  failure_reason?: string;
}

export interface GitFusionPipelineJobListResponse {
  data: GitFusionPipelineJob[];
}

/** Raw trace (log) of a single pipeline job, from `GET /api/v1/pipeline-job-trace`. */
export interface GitFusionPipelineJobTrace {
  job_id: string;
  content: string;
  /** True when the backend truncated the log at its size ceiling (~4 MB); the full trace is in GitLab. */
  truncated?: boolean;
}
