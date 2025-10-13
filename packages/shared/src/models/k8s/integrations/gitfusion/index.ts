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
