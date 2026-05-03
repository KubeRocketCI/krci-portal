import type * as React from "react";
import { type MetricRange, type PodPhase } from "@my-project/shared";

export const RANGE_OPTIONS: ReadonlyArray<{ value: MetricRange; label: string }> = [
  { value: "5m", label: "Last 5 minutes" },
  { value: "15m", label: "Last 15 minutes" },
  { value: "1h", label: "Last 1 hour" },
  { value: "6h", label: "Last 6 hours" },
  { value: "24h", label: "Last 24 hours" },
];

export const DEFAULT_RANGE: MetricRange = "1h";
export const DEFAULT_AUTO_REFRESH = true;
export const REFRESH_INTERVAL_MS = 30_000;

/** Tailwind-700 palette; cycles when there are more apps than colors. */
export const CHART_PALETTE = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#a855f7",
  "#84cc16",
] as const;

/**
 * Standardised text styling for every chart. Recharts defaults render axis
 * ticks and legend at the SVG default (~14 px), which dwarfs the surrounding
 * Card chrome. These overrides bring chart text into line with the portal.
 */
export const CHART_TEXT = {
  axisTick: { fontSize: 11, fill: "var(--muted-foreground)" },
  axisLine: { stroke: "var(--border)" },
  legendWrapper: { fontSize: 12, color: "var(--foreground)" },
  tooltipWrapper: { fontSize: 12 },
  tooltipContent: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    padding: "6px 8px",
    color: "var(--foreground)",
  } as React.CSSProperties,
  grid: { stroke: "var(--border)", strokeDasharray: "3 3", opacity: 0.5 },
} as const;

import type { BadgeProps } from "@/core/components/ui/badge";

export const POD_PHASE_BADGE_VARIANT: Record<PodPhase, NonNullable<BadgeProps["variant"]>> = {
  Running: "success",
  Pending: "warning",
  Succeeded: "info",
  Failed: "error",
  Unknown: "neutral",
};
