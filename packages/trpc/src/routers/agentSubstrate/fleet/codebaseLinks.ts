import {
  gitProvider,
  K8sApiError,
  k8sCodebaseConfig,
  k8sGitServerConfig,
  stripTrailingSlash,
  type Codebase,
  type CodebaseRef,
  type GitServer,
  type KubeObjectListBase,
} from "@my-project/shared";
import { K8sClient } from "../../../clients/k8s/index.js";
import type { CustomSession } from "../../../context/types.js";

/** Statuses not logged: the user may not read the resource, or it does not exist. */
const QUIET_STATUS = new Set([403, 404]);

export interface CodebaseLink {
  codebase: CodebaseRef;
  /**
   * The GitLab web URL of the repository, no trailing slash. Null when the GitServer is not GitLab or cannot be read,
   * `status.gitWebUrl` does not name the project path, or matching Codebases disagree on it.
   */
  gitlabRepoUrl: string | null;
}

/** By project path: the Codebase whose `gitUrlPath` is `/` + project path (ADR 0001). */
export type CodebaseLinks = Map<string, CodebaseLink>;

function projectPathOf(codebase: Codebase): string | null {
  const gitUrlPath = codebase.spec?.gitUrlPath;
  return gitUrlPath?.startsWith("/") ? gitUrlPath.slice(1) : null;
}

function encodedPath(projectPath: string): string | null {
  const segments = projectPath.split("/");
  if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) return null;
  return `/${segments.map(encodeURIComponent).join("/")}`;
}

function hostnameOf(gitHost: string | undefined): string | null {
  if (!gitHost) return null;
  try {
    return new URL(gitHost.includes("://") ? gitHost : `https://${gitHost}`).hostname;
  } catch {
    return null;
  }
}

/**
 * Null unless `status.gitWebUrl` is an http(s) URL whose path ends with the project path; no query or fragment.
 * The codebase operator writes `gitWebUrl` from `gitHost` without `httpsPort`: an https URL on the GitServer host with
 * no port gets the GitServer `httpsPort`.
 */
function repoUrlOf(codebase: Codebase, projectPath: string, gitServer: GitServer): string | null {
  const suffix = encodedPath(projectPath);
  const gitWebUrl = codebase.status?.gitWebUrl;
  if (!suffix || !gitWebUrl) return null;
  try {
    const url = new URL(gitWebUrl);
    if ((url.protocol !== "https:" && url.protocol !== "http:") || url.search || url.hash) return null;
    const pathname = stripTrailingSlash(url.pathname);
    if (!pathname.endsWith(suffix)) return null;

    const { gitHost, httpsPort } = gitServer.spec;
    if (url.protocol === "https:" && !url.port && httpsPort && url.hostname === hostnameOf(gitHost)) {
      url.port = String(httpsPort);
    }
    return `${url.origin}${pathname}`;
  } catch {
    return null;
  }
}

function logUnexpected(error: unknown, what: string): void {
  if (!(error instanceof K8sApiError && QUIET_STATUS.has(error.statusCode))) {
    console.warn(`[AgentSubstrate] ${what} failed:`, error);
  }
}

async function listCodebases(k8sClient: K8sClient, namespace: string): Promise<Codebase[]> {
  try {
    const list = (await k8sClient.listAllResources(k8sCodebaseConfig, namespace)) as KubeObjectListBase<Codebase>;
    return list.items ?? [];
  } catch (error) {
    logUnexpected(error, `Codebase list in namespace ${namespace}`);
    return [];
  }
}

async function gitlabServersByName(
  k8sClient: K8sClient,
  names: string[],
  namespace: string
): Promise<Map<string, GitServer>> {
  const entries = await Promise.all(
    names.map(async (name) => {
      try {
        const gitServer = (await k8sClient.getResource(k8sGitServerConfig, name, namespace)) as GitServer;
        return gitServer.spec?.gitProvider === gitProvider.gitlab ? [[name, gitServer] as const] : [];
      } catch (error) {
        logUnexpected(error, `GitServer ${namespace}/${name} read`);
        return [];
      }
    })
  );
  return new Map(entries.flat());
}

/**
 * Reads with the user's `idToken`. Only GitServers that matching Codebases name are read, once each. Each read fails
 * alone. Several Codebases on one project path: the first by name is linked; `gitlabRepoUrl` is set only when all give
 * the same one.
 */
export async function readCodebaseLinks(
  session: CustomSession,
  namespace: string,
  projectPaths: ReadonlySet<string>
): Promise<CodebaseLinks> {
  const links: CodebaseLinks = new Map();
  if (!namespace || projectPaths.size === 0) return links;

  const k8sClient = new K8sClient(session);
  if (!k8sClient.KubeConfig) return links;

  const matchesByPath = new Map<string, Codebase[]>();
  for (const codebase of await listCodebases(k8sClient, namespace)) {
    const projectPath = projectPathOf(codebase);
    if (projectPath === null || !projectPaths.has(projectPath)) continue;
    matchesByPath.set(projectPath, [...(matchesByPath.get(projectPath) ?? []), codebase]);
  }
  if (matchesByPath.size === 0) return links;

  const gitServerNames = [...new Set([...matchesByPath.values()].flat().map((codebase) => codebase.spec.gitServer))];
  const gitlabServers = await gitlabServersByName(k8sClient, gitServerNames, namespace);

  for (const [projectPath, matches] of matchesByPath) {
    const [first] = [...matches].sort((a, b) => a.metadata.name.localeCompare(b.metadata.name));
    const repoUrls = new Set(
      matches.map((codebase) => {
        const gitServer = gitlabServers.get(codebase.spec.gitServer);
        return gitServer ? repoUrlOf(codebase, projectPath, gitServer) : null;
      })
    );
    const [repoUrl] = repoUrls;
    links.set(projectPath, {
      codebase: { name: first.metadata.name, namespace },
      gitlabRepoUrl: repoUrls.size === 1 ? (repoUrl ?? null) : null,
    });
  }
  return links;
}

export function gitlabIssueUrl(repoUrl: string, iid: string): string | null {
  return /^[1-9]\d*$/.test(iid) ? `${repoUrl}/-/issues/${iid}` : null;
}
