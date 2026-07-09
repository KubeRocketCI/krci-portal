import { useTRPCClient } from "@/core/providers/trpc";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { PipelineRunMetricsOutput } from "@my-project/shared";
import { REFRESH_INTERVAL_MS } from "@/core/components/metrics/constants";
import type { TaskPodRef } from "../utils";

export interface UsePipelineRunMetricsParams {
  clusterName: string;
  namespace: string;
  pods: TaskPodRef[];
  /** Unix seconds (already padded by the caller). */
  start: number;
  /** Unix seconds; undefined while the run is in flight (server uses "now"). */
  end: number | undefined;
  enabled: boolean;
}

export function usePipelineRunMetrics(params: UsePipelineRunMetricsParams) {
  const trpc = useTRPCClient();
  const { clusterName, namespace, pods, start, end, enabled } = params;
  const isInFlight = end === undefined;

  return useQuery<PipelineRunMetricsOutput>({
    // Pod list is already in stable (pipeline-task execution) order.
    queryKey: [
      "prometheus.getPipelineRunMetrics",
      clusterName,
      namespace,
      pods.map((p) => p.podName).join(","),
      start,
      end ?? "live",
    ],
    queryFn: () =>
      trpc.prometheus.getPipelineRunMetrics.query({
        clusterName,
        namespace,
        pods: pods.map(({ podName, task }) => ({ podName, task })),
        start,
        end,
      }),
    enabled,
    // A completed run's window is immutable — fetch once and keep it.
    refetchInterval: isInFlight ? REFRESH_INTERVAL_MS : false,
    staleTime: isInFlight ? REFRESH_INTERVAL_MS : Infinity,
    placeholderData: keepPreviousData,
    retry: 1,
  });
}
