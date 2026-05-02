import { useTRPCClient } from "@/core/providers/trpc";
import { sortByName } from "@/core/utils/sortByName";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { DeploymentMetricsOutput, MetricRange } from "@my-project/shared";
import { REFRESH_INTERVAL_MS } from "../constants";

export interface UseDeploymentMetricsParams {
  clusterName: string;
  namespace: string;
  applications: string[];
  range: MetricRange;
  autoRefresh: boolean;
  /** When false, the query is suspended (e.g. remote-cluster Stage). */
  enabled: boolean;
}

export function useDeploymentMetrics(params: UseDeploymentMetricsParams) {
  const trpc = useTRPCClient();
  const { clusterName, namespace, applications, range, autoRefresh, enabled } = params;

  // Stable cache key independent of input order.
  const sortedApps = [...applications].sort(sortByName);

  return useQuery<DeploymentMetricsOutput>({
    queryKey: ["prometheus.getDeploymentMetrics", clusterName, namespace, sortedApps.join(","), range],
    queryFn: () =>
      trpc.prometheus.getDeploymentMetrics.query({
        clusterName,
        namespace,
        applications,
        range,
      }),
    enabled,
    refetchInterval: autoRefresh ? REFRESH_INTERVAL_MS : false,
    staleTime: REFRESH_INTERVAL_MS,
    placeholderData: keepPreviousData,
    retry: 1,
  });
}
