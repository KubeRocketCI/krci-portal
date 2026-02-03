import { useClusterStore } from "@/k8s/store";

/**
 * Hook to generate SonarQube external URLs
 *
 * @returns Functions to generate SonarQube URLs
 *
 * @example
 * const { getProjectUrl, getIssueUrl } = useSonarQubeUrl();
 * const projectUrl = getProjectUrl("my-project");
 * const issueUrl = getIssueUrl("my-project", "issue-key");
 */
export function useSonarQubeUrl(): {
  baseUrl: string;
  getProjectUrl: (projectKey: string) => string;
  getIssueUrl: (projectKey: string, issueKey: string) => string;
} {
  const baseUrl = useClusterStore((state) => state.sonarWebUrl);

  function getProjectUrl(projectKey: string): string {
    if (!baseUrl) return "#";
    return `${baseUrl}/dashboard?id=${encodeURIComponent(projectKey)}`;
  }

  function getIssueUrl(projectKey: string, issueKey: string): string {
    if (!baseUrl) return "#";
    return `${baseUrl}/project/issues?id=${encodeURIComponent(projectKey)}&open=${encodeURIComponent(issueKey)}`;
  }

  return {
    baseUrl,
    getProjectUrl,
    getIssueUrl,
  };
}
