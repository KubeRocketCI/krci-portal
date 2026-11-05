import { gitProvider } from "../../../common/index.js";

export const BITBUCKET_CLOUD_HOST = "bitbucket.org";
export const BITBUCKET_CLOUD_SSH_HOST = "ssh.bitbucket.org";

/**
 * Returns the host for SSH connections to a GitServer.
 * Bitbucket Cloud SSH endpoint: ssh.bitbucket.org. HTTPS and web links stay on gitHost.
 */
export function getGitServerSSHHost({ gitProvider: provider, gitHost }: { gitProvider?: string; gitHost: string }) {
  if (provider === gitProvider.bitbucket && gitHost.toLowerCase() === BITBUCKET_CLOUD_HOST) {
    return BITBUCKET_CLOUD_SSH_HOST;
  }

  return gitHost;
}
