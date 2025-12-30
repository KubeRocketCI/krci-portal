import { useTRPCClient } from "@/core/providers/trpc";
import { useQuery } from "@tanstack/react-query";
import { DEFAULT_PORTFOLIO_METRICS_DAYS } from "@my-project/shared";

export interface UsePortfolioMetricsOptions {
  days?: number;
  enabled?: boolean;
}

/**
 * Hook to fetch Dependency Track portfolio metrics
 *
 * @param options - Query options
 * @returns Portfolio metrics data and query state
 */
export const usePortfolioMetrics = (options: UsePortfolioMetricsOptions = {}) => {
  const { days = DEFAULT_PORTFOLIO_METRICS_DAYS, enabled = true } = options;
  const trpc = useTRPCClient();

  return useQuery({
    queryKey: ["dependencyTrack", "portfolioMetrics", days],
    queryFn: () => trpc.dependencyTrack.getPortfolioMetrics.query({ days }),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};
