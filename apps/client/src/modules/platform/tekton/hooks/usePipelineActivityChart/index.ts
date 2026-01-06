/**
 * usePipelineActivityChart Hook
 *
 * Fetches time-series pipeline activity data for charting.
 * Groups data by hour (for TODAY) or day (for WEEK/MONTH/QUARTER).
 *
 * @param namespace - Kubernetes namespace to query
 * @param options - Query options including timeRange and enabled flag
 * @returns React Query result with transformed ChartDataPoint array
 */

import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { useQuery } from "@tanstack/react-query";
import {
  TektonSummaryResponse,
  TimeRange,
  TIME_RANGES,
  getTimeRangeStartTimestamp,
  getUtcMidnightToday,
} from "@my-project/shared";
import {
  buildPipelineRunTypeFilter,
  buildTimeRangeFilter,
  buildCodebaseFilter,
  combineFilters,
} from "../usePipelineMetrics/filters";

/** Data point for activity chart visualization */
export interface ChartDataPoint {
  /** Unix timestamp for the time bucket */
  timestamp: number;
  /** Formatted label for display (e.g., "10:00" or "Dec 15") */
  label: string;
  /** Number of succeeded runs */
  succeeded: number;
  /** Number of failed runs */
  failed: number;
  /** Total runs */
  total: number;
}

export interface UsePipelineActivityChartOptions {
  /** Time range for the chart (default: TODAY) */
  timeRange?: TimeRange;
  /** Filter by codebase */
  codebase?: string;
  /** Enable/disable the query (default: true) */
  enabled?: boolean;
}

/** Granularity mapping: time range -> group_by parameter */
const GRANULARITY_MAP: Record<TimeRange, "hour" | "day"> = {
  [TIME_RANGES.TODAY]: "hour",
  [TIME_RANGES.WEEK]: "day",
  [TIME_RANGES.MONTH]: "day",
  [TIME_RANGES.QUARTER]: "day",
};

/** Seconds per hour */
const SECONDS_PER_HOUR = 3600;
/** Seconds per day */
const SECONDS_PER_DAY = 86400;

/** Format timestamp to label based on granularity */
function formatLabel(timestamp: number, granularity: "hour" | "day"): string {
  const date = new Date(timestamp * 1000);

  if (granularity === "hour") {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  }

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

/**
 * Get current time aligned to UTC bucket boundary
 * API returns timestamps at UTC midnight for days, UTC hour start for hours
 */
function getCurrentUtcBucket(granularity: "hour" | "day"): number {
  const now = new Date();
  if (granularity === "hour") {
    const utcHour = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), 0, 0, 0);
    return Math.floor(utcHour / 1000);
  }
  return Math.floor(getUtcMidnightToday() / 1000);
}

/** Generate all expected time buckets for the range and fill gaps */
function fillGaps(
  data: TektonSummaryResponse["summary"],
  startTimestamp: number,
  granularity: "hour" | "day"
): ChartDataPoint[] {
  const buckets = new Map<number, ChartDataPoint>();

  for (const item of data) {
    if (item.group_value != null && typeof item.group_value === "number") {
      buckets.set(item.group_value, {
        timestamp: item.group_value,
        label: formatLabel(item.group_value, granularity),
        succeeded: item.succeeded ?? 0,
        failed: item.failed ?? 0,
        total: item.total ?? 0,
      });
    }
  }

  const result: ChartDataPoint[] = [];
  const secondsPerBucket = granularity === "hour" ? SECONDS_PER_HOUR : SECONDS_PER_DAY;
  const nowTimestamp = getCurrentUtcBucket(granularity);

  for (let ts = startTimestamp; ts <= nowTimestamp; ts += secondsPerBucket) {
    const existing = buckets.get(ts);
    result.push(
      existing ?? {
        timestamp: ts,
        label: formatLabel(ts, granularity),
        succeeded: 0,
        failed: 0,
        total: 0,
      }
    );
  }

  return result;
}

/** Query stale time in milliseconds */
const QUERY_STALE_TIME = 30_000;
/** Query refetch interval in milliseconds */
const QUERY_REFETCH_INTERVAL = 60_000;

/**
 * Hook to fetch pipeline activity data for time-series charts
 *
 * @param namespace - Kubernetes namespace to query
 * @param options - Query options
 * @returns React Query result with ChartDataPoint array
 */
export function usePipelineActivityChart(namespace: string, options: UsePipelineActivityChartOptions = {}) {
  const trpc = useTRPCClient();
  const clusterName = useClusterStore((state) => state.clusterName);

  const { timeRange = TIME_RANGES.TODAY, codebase, enabled = true } = options;

  const granularity = GRANULARITY_MAP[timeRange];
  const startTimestamp = getTimeRangeStartTimestamp(timeRange);

  const filter = combineFilters(
    buildPipelineRunTypeFilter(),
    buildTimeRangeFilter(timeRange),
    codebase ? buildCodebaseFilter(codebase) : undefined
  );

  return useQuery<TektonSummaryResponse, Error, ChartDataPoint[]>({
    queryKey: ["tektonResults", "activityChart", clusterName, namespace, timeRange, codebase],
    queryFn: () =>
      trpc.tektonResults.getSummary.query({
        namespace,
        summary: "total,succeeded,failed",
        groupBy: granularity,
        filter,
      }),
    enabled: enabled && Boolean(namespace),
    staleTime: QUERY_STALE_TIME,
    refetchInterval: QUERY_REFETCH_INTERVAL,
    select: (data): ChartDataPoint[] => fillGaps(data.summary || [], startTimestamp, granularity),
  });
}
