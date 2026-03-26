import { useProject } from "@/modules/platform/security/pages/sast-project-details/hooks/useProject";

interface UseSonarQubeDataOptions {
  /**
   * Codebase name (matches SonarQube projectKey)
   */
  codebaseName: string;
}

/**
 * Fetch SonarQube project data for a codebase
 *
 * @param options - Query options
 * @returns React Query result with project data
 *
 * @example
 * const { data: project, isLoading } = useSonarQubeData({
 *   codebaseName: "my-service"
 * });
 */
export function useSonarQubeData({ codebaseName }: UseSonarQubeDataOptions) {
  return useProject(codebaseName);
}
