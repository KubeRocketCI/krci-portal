import { GitProvider, gitProvider } from "@my-project/shared";

export function getDefaultGitProvider(usedProviders: Set<GitProvider>): GitProvider | undefined {
  if (!usedProviders.has(gitProvider.github)) {
    return gitProvider.github;
  }

  return Object.values(gitProvider).find((provider) => !usedProviders.has(provider));
}
