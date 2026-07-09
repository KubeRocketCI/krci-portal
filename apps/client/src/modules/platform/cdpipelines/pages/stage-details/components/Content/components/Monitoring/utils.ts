import type { MetricSeriesByApp } from "@my-project/shared";

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
