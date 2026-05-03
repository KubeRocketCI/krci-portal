import type { MetricSeriesByApp } from "@my-project/shared";
import type { MetricUnit } from "./types";

const BYTE_UNITS = ["B", "KiB", "MiB", "GiB", "TiB"] as const;

export function humanBytes(v: number): string {
  if (!Number.isFinite(v) || v <= 0) return "0";
  const raw = Math.floor(Math.log(v) / Math.log(1024));
  const i = Math.min(BYTE_UNITS.length - 1, Math.max(0, raw));
  return `${(v / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${BYTE_UNITS[i]}`;
}

export function formatValue(unit: MetricUnit, v: number): string {
  if (unit === "cores") return v.toFixed(2);
  if (unit === "MiB") return Math.round(v / (1024 * 1024)).toString();
  if (unit === "bytes/s") return `${humanBytes(v)}/s`;
  if (unit === "percent") return `${formatPercent(v)}%`;
  return Math.round(v).toString();
}

/** Format a unix-seconds timestamp as a locale time string. */
export function formatChartTimestamp(t: number): string {
  return new Date(t * 1000).toLocaleTimeString();
}

/** Slugify a chart title for use in stable data-tour attributes. */
export function chartSlug(title: string): string {
  const collapsed = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const start = collapsed.startsWith("-") ? 1 : 0;
  const end = collapsed.endsWith("-") ? collapsed.length - 1 : collapsed.length;
  return start >= end ? "" : collapsed.slice(start, end);
}

/**
 * Sum the latest sample of every pod under every selected app. Apps with
 * no pods, or pods with empty series (kube-state-metrics omits a series
 * entirely when the resource isn't configured, so empty == not set), are
 * skipped.
 */
export function latestSumByApp(series: MetricSeriesByApp[], apps: ReadonlySet<string>): number {
  let total = 0;
  for (const entry of series) {
    if (!apps.has(entry.app)) continue;
    for (const pod of entry.pods) {
      if (pod.series.length === 0) continue;
      total += pod.series[pod.series.length - 1].v;
    }
  }
  return total;
}

/**
 * Compute utilisation percentage matching Grafana's
 * `sum(usage) / sum(capacity)` semantic, summing across every pod of
 * every selected app on both sides. Returns `null` when no selected app
 * has any pod with capacity configured.
 */
export function computeUtilization(
  usage: MetricSeriesByApp[],
  capacity: MetricSeriesByApp[],
  apps: ReadonlySet<string>
): number | null {
  let totalCapacity = 0;
  let hasCapacity = false;
  for (const entry of capacity) {
    if (!apps.has(entry.app)) continue;
    for (const pod of entry.pods) {
      if (pod.series.length === 0) continue;
      totalCapacity += pod.series[pod.series.length - 1].v;
      hasCapacity = true;
    }
  }
  if (!hasCapacity || totalCapacity <= 0) return null;
  return (latestSumByApp(usage, apps) / totalCapacity) * 100;
}

/**
 * Grafana-style percent formatting: more precision at small magnitudes so
 * single-digit utilisation reads as "9.18", not "9".
 */
export function formatPercent(v: number): string {
  if (!Number.isFinite(v)) return "0";
  const abs = Math.abs(v);
  if (abs >= 100) return v.toFixed(0);
  if (abs >= 10) return v.toFixed(1);
  return v.toFixed(2);
}
