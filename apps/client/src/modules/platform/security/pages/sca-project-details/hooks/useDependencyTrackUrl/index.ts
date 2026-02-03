import { useClusterStore } from "@/k8s/store";

/**
 * Hook to generate Dependency Track external URLs
 *
 * @returns Functions to generate Dependency Track URLs
 *
 * @example
 * const { getProjectUrl } = useDependencyTrackUrl();
 * const projectUrl = getProjectUrl("project-uuid");
 */
export function useDependencyTrackUrl(): {
  baseUrl: string;
  getProjectUrl: (projectUuid: string) => string;
  getComponentUrl: (componentUuid: string) => string;
  getVulnerabilityUrl: (vulnerabilityId: string) => string;
} {
  const baseUrl = useClusterStore((state) => state.dependencyTrackWebUrl);

  function getProjectUrl(projectUuid: string): string {
    if (!baseUrl) return "#";
    return `${baseUrl}/projects/${encodeURIComponent(projectUuid)}`;
  }

  function getComponentUrl(componentUuid: string): string {
    if (!baseUrl) return "#";
    return `${baseUrl}/components/${encodeURIComponent(componentUuid)}`;
  }

  function getVulnerabilityUrl(vulnerabilityId: string): string {
    if (!baseUrl) return "#";
    return `${baseUrl}/vulnerabilities/${encodeURIComponent(vulnerabilityId)}`;
  }

  return {
    baseUrl,
    getProjectUrl,
    getComponentUrl,
    getVulnerabilityUrl,
  };
}
