import { useTRPCClient } from "@/core/providers/trpc";
import { useQuery } from "@tanstack/react-query";

/**
 * Hook to get a single project with full metadata and metrics
 *
 * Uses the direct getProject tRPC query which makes 2 targeted SonarQube API calls:
 * 1. Search for the specific project (gets name, visibility, lastAnalysisDate, etc.)
 * 2. Fetch measures for that project (gets all metrics)
 *
 * @param projectKey - SonarQube project/component key
 * @returns Project with full metadata and measures, or null if not found
 */
export function useProject(projectKey: string) {
  const trpc = useTRPCClient();

  return useQuery({
    queryKey: ["sonarqube", "project", projectKey],
    queryFn: () =>
      trpc.sonarqube.getProject.query({
        componentKey: projectKey,
      }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
