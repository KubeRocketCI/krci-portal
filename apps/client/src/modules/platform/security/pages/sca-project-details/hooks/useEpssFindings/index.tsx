import { useTRPCClient } from "@/core/providers/trpc";
import { useQuery } from "@tanstack/react-query";

interface UseEpssFindingsParams {
  uuid: string;
  suppressed?: boolean;
}

/**
 * Hook to fetch EPSS findings for a project from Dependency Track
 * Fetches findings from NVD source which contains EPSS score data
 * @param params - Query parameters including UUID and suppressed flag
 */
export function useEpssFindings(params: UseEpssFindingsParams) {
  const trpc = useTRPCClient();

  return useQuery({
    queryKey: ["dependencyTrack", "epss-findings", params],
    queryFn: () =>
      trpc.dependencyTrack.getFindingsByProject.query({
        ...params,
        source: "NVD", // EPSS data comes from NVD
      }),
    enabled: !!params.uuid,
    staleTime: 60000, // 1 minute
    retry: 1,
  });
}
