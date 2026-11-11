import { GitProvider, gitProvider, gitUser } from "@my-project/shared";

export function getDefaultGitUser(provider: GitProvider): string {
  switch (provider) {
    case gitProvider.gerrit:
      return gitUser.GERRIT;
    case gitProvider.github:
      return gitUser.GITHUB;
    case gitProvider.gitlab:
      return gitUser.GITLAB;
    case gitProvider.bitbucket:
      return gitUser.BITBUCKET;
  }
}
