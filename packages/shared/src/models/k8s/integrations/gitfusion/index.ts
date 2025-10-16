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
