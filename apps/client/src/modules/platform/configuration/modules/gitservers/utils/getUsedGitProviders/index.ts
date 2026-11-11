import { GitProvider, GitServer, gitProviderEnum } from "@my-project/shared";

/**
 * Providers that cannot be used for a new Git Server: the provider of an existing server,
 * or a provider value that equals the name of an existing server (the portal names a new
 * server after its provider).
 */
export function getUsedGitProviders(gitServers: GitServer[] | undefined): Set<GitProvider> {
  const usedProviders = new Set<GitProvider>();

  for (const gitServer of gitServers ?? []) {
    const provider = gitServer.spec?.gitProvider;

    if (provider) {
      usedProviders.add(provider);
    }

    const nameAsProvider = gitProviderEnum.safeParse(gitServer.metadata?.name);

    if (nameAsProvider.success) {
      usedProviders.add(nameAsProvider.data);
    }
  }

  return usedProviders;
}
