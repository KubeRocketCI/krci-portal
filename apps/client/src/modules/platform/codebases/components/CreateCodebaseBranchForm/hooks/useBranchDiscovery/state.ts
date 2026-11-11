import { GitServer, gitProvider } from "@my-project/shared";

export interface BranchDiscoveryStateInput {
  gitServerName: string | undefined;
  owner: string;
  repoName: string;
  gitServer: GitServer | undefined;
  isGitServerLoading: boolean;
}

export interface BranchDiscoveryState {
  isGerrit: boolean;
  isEnabled: boolean;
  isGitServerPending: boolean;
  isGitServerUnavailable: boolean;
}

export function getBranchDiscoveryState({
  gitServerName,
  owner,
  repoName,
  gitServer,
  isGitServerLoading,
}: BranchDiscoveryStateInput): BranchDiscoveryState {
  const hasRepoCoordinates = !!gitServerName && !!owner && !!repoName;
  const isGerrit = gitServer?.spec?.gitProvider === gitProvider.gerrit;

  return {
    isGerrit,
    isEnabled: hasRepoCoordinates && !!gitServer && !isGerrit,
    isGitServerPending: hasRepoCoordinates && isGitServerLoading,
    isGitServerUnavailable: hasRepoCoordinates && !isGitServerLoading && !gitServer,
  };
}
