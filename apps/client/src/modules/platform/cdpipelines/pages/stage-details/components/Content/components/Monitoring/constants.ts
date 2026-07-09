import { type MetricRange, type PodPhase } from "@my-project/shared";
import type { BadgeProps } from "@/core/components/ui/badge";

export const RANGE_OPTIONS: ReadonlyArray<{ value: MetricRange; label: string }> = [
  { value: "5m", label: "Last 5 minutes" },
  { value: "15m", label: "Last 15 minutes" },
  { value: "1h", label: "Last 1 hour" },
  { value: "6h", label: "Last 6 hours" },
  { value: "24h", label: "Last 24 hours" },
];

export const DEFAULT_RANGE: MetricRange = "1h";
export const DEFAULT_AUTO_REFRESH = true;

export const POD_PHASE_BADGE_VARIANT: Record<PodPhase, NonNullable<BadgeProps["variant"]>> = {
  Running: "success",
  Pending: "warning",
  Succeeded: "info",
  Failed: "error",
  Unknown: "neutral",
};
