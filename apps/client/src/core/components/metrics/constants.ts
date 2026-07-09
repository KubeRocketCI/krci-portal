import type * as React from "react";

export const REFRESH_INTERVAL_MS = 30_000;

/** Tailwind-700 palette; cycles when there are more series than colors. */
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
