import { useTRPCClient } from "@/core/providers/trpc";
import { useQuery } from "@tanstack/react-query";

/**
 * Hook to fetch project metrics time series from Dependency Track
 * @param uuid - Project UUID
 * @param days - Number of days to fetch (default: 90)
 */
export function useProjectMetrics(uuid: string, days: number = 90) {
  const trpc = useTRPCClient();

  return useQuery({
    queryKey: ["dependencyTrack", "projectMetrics", uuid, days],
    queryFn: () => trpc.dependencyTrack.getProjectMetrics.query({ uuid, days }),
    enabled: !!uuid,
    staleTime: 60000, // 1 minute
    retry: 1,
  });
}
