import { useTRPCClient } from "@/core/providers/trpc";
import { useQuery } from "@tanstack/react-query";

interface UseSonarQubeProjectOptions {
  /**
   * SonarQube component/project key (usually matches codebase name)
   */
  componentKey: string;

  /**
   * Whether to enable the query
   */
  enabled?: boolean;
}

/**
 * Fetch SonarQube project data with metrics
 *
 * Uses direct TRPC call to SonarQube API (server-side).
 *
 * @param options - Query options
 * @returns React Query result with project data
 *
 * @example
 * const { data, isLoading, error } = useSonarQubeProject({
 *   componentKey: "my-service"
 * });
 */
export function useSonarQubeProject({ componentKey, enabled = true }: UseSonarQubeProjectOptions) {
  const trpc = useTRPCClient();

  return useQuery({
    queryKey: ["sonarqube", "project", componentKey],
    queryFn: async () => {
      return await trpc.sonarqube.getProject.query({ componentKey });
    },
    enabled: enabled && !!componentKey,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Only retry once on failure
  });
}
