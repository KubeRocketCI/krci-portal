/**
 * usePipelineMetrics Hook
 *
 * Fetches aggregated pipeline metrics from Tekton Results Summary API.
 * Supports filtering by time range, pipeline type, and codebase.
 *
 * @module usePipelineMetrics
 */

import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { useQuery } from "@tanstack/react-query";
import {
  TektonSummaryResponse,
  TektonSummaryItem,
  TimeRange,
  TIME_RANGES,
  TektonResultsPipelineType,
  DEFAULT_SUMMARY_METRICS,
  GroupBy,
} from "@my-project/shared";
import {
  buildTimeRangeFilter,
  buildPipelineTypeFilter,
  buildPipelineRunTypeFilter,
  buildCodebaseFilter,
  combineFilters,
} from "./filters";

export interface UsePipelineMetricsOptions {
  /** Time range for metrics (default: today) */
  timeRange?: TimeRange;
  /** Filter by pipeline type */
  pipelineType?: TektonResultsPipelineType;
  /** Filter by codebase */
  codebase?: string;
  /** Group results by field */
  groupBy?: GroupBy;
  /** Custom metrics to fetch (comma-separated) */
  summary?: string;
  /** Enable/disable the query */
  enabled?: boolean;
}

export interface NormalizedPipelineMetrics {
  /** Summary items (single item if no groupBy, multiple if grouped) */
  items: TektonSummaryItem[];
  /** First item for convenience when not grouping */
  summary: TektonSummaryItem | null;
  /** Computed success rate (0-100) */
  successRate: number | null;
  /** Computed failure rate (0-100) */
  failureRate: number | null;
}

const DEFAULT_STALE_TIME = 30_000; // 30 seconds
const DEFAULT_REFETCH_INTERVAL = 60_000; // 1 minute

/**
 * Hook to fetch aggregated pipeline metrics from Tekton Results Summary API
 *
 * @param namespace - Kubernetes namespace
 * @param options - Query options for filtering and grouping
 * @returns React Query result with normalized metrics data
 *
 * @example
 * // Get overall metrics for today
 * const { data, isLoading } = usePipelineMetrics(namespace);
 *
 * @example
 * // Get build pipeline metrics for last 7 days
 * const { data } = usePipelineMetrics(namespace, {
 *   timeRange: TIME_RANGES.WEEK,
 *   pipelineType: PIPELINE_TYPES.BUILD,
 * });
 *
 * @example
 * // Get metrics grouped by day
 * const { data } = usePipelineMetrics(namespace, {
 *   timeRange: TIME_RANGES.WEEK,
 *   groupBy: GROUP_BY.DAY,
 * });
 */
export function usePipelineMetrics(namespace: string, options: UsePipelineMetricsOptions = {}) {
  const trpc = useTRPCClient();
  const clusterName = useClusterStore((state) => state.clusterName);

  const {
    timeRange = TIME_RANGES.TODAY,
    pipelineType,
    codebase,
    groupBy,
    summary = DEFAULT_SUMMARY_METRICS,
    enabled = true,
  } = options;

  // Build filter expression
  const filter = combineFilters(
    buildPipelineRunTypeFilter(),
    buildTimeRangeFilter(timeRange),
    pipelineType ? buildPipelineTypeFilter(pipelineType) : undefined,
    codebase ? buildCodebaseFilter(codebase) : undefined
  );

  return useQuery<TektonSummaryResponse, Error, NormalizedPipelineMetrics>({
    queryKey: ["tektonResults", "summary", clusterName, namespace, timeRange, pipelineType, codebase, groupBy, summary],
    queryFn: () =>
      trpc.tektonResults.getSummary.query({
        namespace,
        summary,
        groupBy,
        filter,
      }),
    enabled: enabled && Boolean(namespace),
    staleTime: DEFAULT_STALE_TIME,
    refetchInterval: DEFAULT_REFETCH_INTERVAL,
    select: (data): NormalizedPipelineMetrics => {
      const items = data.summary || [];
      const firstItem = items[0] ?? null;

      let successRate: number | null = null;
      let failureRate: number | null = null;

      if (firstItem?.total && firstItem.total > 0) {
        successRate = Math.round(((firstItem.succeeded || 0) / firstItem.total) * 100);
        failureRate = Math.round(((firstItem.failed || 0) / firstItem.total) * 100);
      }

      return { items, summary: firstItem, successRate, failureRate };
    },
  });
}
