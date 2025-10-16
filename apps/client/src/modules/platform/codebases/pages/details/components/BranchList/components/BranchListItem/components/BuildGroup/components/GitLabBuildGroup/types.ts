import { CodebaseBranch } from "@my-project/shared";

export interface GitLabBuildGroupProps {
  codebaseBranch: CodebaseBranch;
  handleOpenGitLabParamsDialog: () => void;
  handleDirectGitLabBuild: () => void;
  menuAnchorEl: HTMLElement | null;
  handleClickMenu: (event: React.MouseEvent<HTMLElement>) => void;
  handleCloseMenu: () => void;
  isGitLabLoading: boolean;
}
