import { useTRPCClient } from "@/core/providers/trpc";
import { useQuery } from "@tanstack/react-query";

interface UseFindingsByProjectParams {
  uuid: string;
  suppressed?: boolean;
}

/**
 * Hook to fetch findings (vulnerabilities) for a project from Dependency Track
 * @param params - Query parameters including UUID and suppressed flag
 */
export function useFindingsByProject(params: UseFindingsByProjectParams) {
  const trpc = useTRPCClient();

  return useQuery({
    queryKey: ["dependencyTrack", "findings", params],
    queryFn: () => trpc.dependencyTrack.getFindingsByProject.query(params),
    enabled: !!params.uuid,
    staleTime: 60000, // 1 minute
    retry: 1,
  });
}
