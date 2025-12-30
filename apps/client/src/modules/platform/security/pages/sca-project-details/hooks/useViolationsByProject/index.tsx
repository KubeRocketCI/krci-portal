import { useTRPCClient } from "@/core/providers/trpc";
import { useQuery } from "@tanstack/react-query";

interface UseViolationsByProjectParams {
  uuid: string;
  suppressed?: boolean;
}

/**
 * Hook to fetch policy violations for a project from Dependency Track
 * @param params - Query parameters including UUID and suppressed flag
 */
export function useViolationsByProject(params: UseViolationsByProjectParams) {
  const trpc = useTRPCClient();

  return useQuery({
    queryKey: ["dependencyTrack", "violations", params],
    queryFn: () => trpc.dependencyTrack.getViolationsByProject.query(params),
    enabled: !!params.uuid,
    staleTime: 60000, // 1 minute
    retry: 1,
  });
}
