import { CodebaseBranch } from "@my-project/shared";

export interface GitLabBuildGroupProps {
  codebaseBranch: CodebaseBranch;
  handleOpenGitLabParamsDialog: () => void;
  handleDirectGitLabBuild: () => void;
  isGitLabLoading: boolean;
}
