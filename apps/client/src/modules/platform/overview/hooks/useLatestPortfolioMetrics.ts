import { useTRPCClient } from "@/core/providers/trpc";
import { useQuery } from "@tanstack/react-query";

export function useLatestPortfolioMetrics() {
  const trpc = useTRPCClient();

  return useQuery({
    queryKey: ["dependencyTrack", "portfolioMetrics", 1],
    queryFn: () => trpc.dependencyTrack.getPortfolioMetrics.query({ days: 1 }),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: false,
  });
}
