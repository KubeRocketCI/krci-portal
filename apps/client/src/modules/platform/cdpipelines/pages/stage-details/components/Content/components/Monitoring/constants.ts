import { type MetricRange } from "@my-project/shared";

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
