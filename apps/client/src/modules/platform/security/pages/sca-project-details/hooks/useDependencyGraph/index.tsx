import { useTRPCClient } from "@/core/providers/trpc";
import { useQuery } from "@tanstack/react-query";

interface UseDependencyGraphParams {
  uuid: string;
}

/**
 * Hook to fetch dependency graph for a project from Dependency Track
 * @param params - Query parameters including project UUID
 */
export function useDependencyGraph(params: UseDependencyGraphParams) {
  const trpc = useTRPCClient();

  return useQuery({
    queryKey: ["dependencyTrack", "dependencyGraph", params.uuid],
    queryFn: () => trpc.dependencyTrack.getDependencyGraph.query(params),
    enabled: !!params.uuid,
    staleTime: 60000, // 1 minute
    retry: 1,
  });
}
