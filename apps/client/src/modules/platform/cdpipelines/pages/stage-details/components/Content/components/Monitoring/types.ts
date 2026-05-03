import type * as React from "react";
import type { MetricRange, MetricSeriesByApp, PodPhaseByApp } from "@my-project/shared";

export type MetricUnit = "cores" | "MiB" | "bytes/s" | "count" | "events" | "percent";

export interface MetricChartProps {
  title: string;
  unit: MetricUnit;
  data: MetricSeriesByApp[];
  isLoading: boolean;
  error: Error | null;
  /**
   * Optional client-side filter for callers that pass a superset of the apps
   * to render (e.g. storybook stories with static data). Production passes
   * data already scoped to the selected apps via the metrics query, so this
   * prop is left unset there.
   */
  selectedApps?: ReadonlySet<string>;
  /**
   * Resolution of the time series in seconds. Used to bucket cursor timestamps
   * so neighbouring pixels in the same step short-circuit the cross-chart
   * cursor broadcast.
   */
  step?: number;
  /**
   * Explicit `[startSec, endSec]` bounds for the X axis (unix seconds). When
   * set, the chart spans the full selected time range even if data only
   * exists for part of it — so a 24h selection always reads as 24h, with
   * empty space where Prometheus has no samples (e.g. before the pod
   * started). Falls back to data-fitted axis when omitted.
   */
  domain?: [number, number];
}

export interface ToolbarProps {
  range: MetricRange;
  onRangeChange: (range: MetricRange) => void;
  autoRefresh: boolean;
  onAutoRefreshChange: (next: boolean) => void;
  lastUpdatedAt: number | undefined;
  isStale: boolean;
  /** Apps the user has selected; null means "all". */
  selectedApps: string[] | null;
  /** Apps available to select (resolved from usePipelineAppCodebasesWatch). */
  availableApps: string[];
  onAppsChange: (next: string[]) => void;
  /** Reset the filter to "all applications" (clears the URL param). */
  onAppsClear: () => void;
}

export interface AppMultiSelectProps {
  selectedApps: string[] | null;
  availableApps: string[];
  onChange: (next: string[]) => void;
  onClear: () => void;
}

export interface SectionProps {
  title: string;
  children: React.ReactNode;
  /** Render children in a 2-column grid where the viewport allows. */
  grid?: boolean;
}

export interface PodPhasePanelProps {
  data: PodPhaseByApp[];
  selectedApps?: ReadonlySet<string>;
}

export interface StatPanelProps {
  title: string;
  /** Percentage value to display, or `null` for the "No data" empty state. */
  value: number | null;
  isLoading: boolean;
  error: Error | null;
}
