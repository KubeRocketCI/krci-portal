import type * as React from "react";
import type { MetricSeriesByApp } from "@my-project/shared";

export type MetricUnit = "cores" | "MiB" | "bytes/s" | "count" | "events" | "percent";

export interface MetricChartProps {
  title: string;
  unit: MetricUnit;
  /**
   * Grouped series to render: one line per `pods[].pod` key. The grouping key
   * (`app`) is app names on the Stage monitoring tab and pipeline-task names
   * on the PipelineRun monitoring tab; the line key is pod names / step names
   * respectively.
   */
  data: MetricSeriesByApp[];
  isLoading: boolean;
  error: Error | null;
  /**
   * Optional client-side filter for callers that pass a superset of the groups
   * to render (e.g. storybook stories with static data). Production passes
   * data already scoped via the metrics query, so this prop is left unset there.
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
  /** Prefix for the stable `data-tour` attribute (page-scoped). */
  tourPrefix?: string;
}

export interface SectionProps {
  title: string;
  children: React.ReactNode;
  /** Render children in a 2-column grid where the viewport allows. */
  grid?: boolean;
}

export interface StatPanelProps {
  title: string;
  /** Value to display, or `null` for the "No data" empty state. */
  value: number | null;
  isLoading: boolean;
  error: Error | null;
  /** Value formatter; defaults to Grafana-style percent precision. */
  format?: (value: number) => string;
  /** Unit suffix rendered after the value; defaults to "%". Empty string hides it. */
  suffix?: string;
  /** Prefix for the stable `data-tour` attribute (page-scoped). */
  tourPrefix?: string;
}
