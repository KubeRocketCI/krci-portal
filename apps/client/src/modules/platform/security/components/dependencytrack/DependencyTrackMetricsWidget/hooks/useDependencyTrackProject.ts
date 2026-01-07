import { useTRPCClient } from "@/core/providers/trpc";
import { useQuery } from "@tanstack/react-query";

interface UseDependencyTrackProjectOptions {
  /**
   * DependencyTrack project name (usually matches codebase name)
   */
  projectName: string;

  /**
   * Default branch/version to search for (from Codebase spec.defaultBranch)
   * This ensures we show metrics for the correct branch when multiple versions exist
   */
  defaultBranch: string;

  /**
   * Whether to enable the query
   */
  enabled?: boolean;
}

/**
 * Fetch DependencyTrack project data by name and version
 *
 * Uses direct TRPC call to DependencyTrack API (server-side).
 * Searches for exact match: projectName + defaultBranch.
 *
 * @param options - Query options
 * @returns React Query result with project data
 *
 * @example
 * const { data, isLoading, error } = useDependencyTrackProject({
 *   projectName: "my-service",
 *   defaultBranch: "main"
 * });
 */
export function useDependencyTrackProject({
  projectName,
  defaultBranch,
  enabled = true,
}: UseDependencyTrackProjectOptions) {
  const trpc = useTRPCClient();

  return useQuery({
    queryKey: ["dependencyTrack", "project", projectName, defaultBranch],
    queryFn: async () => {
      return await trpc.dependencyTrack.getProjectByNameAndVersion.query({
        projectName,
        defaultBranch,
      });
    },
    enabled: enabled && !!projectName && !!defaultBranch,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Only retry once on failure
  });
}
