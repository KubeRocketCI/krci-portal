import type { MetricRange, MetricSeriesByApp } from "@my-project/shared";

export type MetricKind = "cpu" | "memory" | "restarts";

export interface MetricChartProps {
  title: string;
  unit: "cores" | "MiB" | "count";
  data: MetricSeriesByApp[];
  isLoading: boolean;
  error: Error | null;
}

export interface ToolbarProps {
  range: MetricRange;
  onRangeChange: (range: MetricRange) => void;
  autoRefresh: boolean;
  onAutoRefreshChange: (next: boolean) => void;
  lastUpdatedAt: number | undefined;
  isStale: boolean;
}
