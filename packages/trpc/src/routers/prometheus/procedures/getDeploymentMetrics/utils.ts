import {
  podLabels,
  podPhaseSchema,
  type PromQLMatrixResponse,
  type PromQLVectorResponse,
  type MetricSeriesByApp,
  type PodPhaseByApp,
  type PodPhase,
} from "@my-project/shared";

/**
 * Rate window scaled to the resolution step. Prometheus recommends a window of
 * at least 4× the scrape/step interval; we floor at 5m so short ranges still
 * have enough samples for a smooth rate.
 */
export function deriveRateWindow(stepSeconds: number): string {
  return `${Math.max(4 * stepSeconds, 300)}s`;
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface PodLike {
  metadata: { name: string; labels?: Record<string, string> };
}

/**
 * Build a Map<app, podName[]> for every requested app, including apps with zero
 * matched pods. Pods whose app label is not in the requested list are dropped.
 */
export function groupPodsByApp(pods: PodLike[], apps: string[]): Map<string, string[]> {
  const wanted = new Set(apps);
  const result = new Map<string, string[]>();
  for (const app of apps) result.set(app, []);
  for (const pod of pods) {
    const label = pod.metadata.labels?.[podLabels.instance];
    if (label && wanted.has(label)) {
      result.get(label)!.push(pod.metadata.name);
    }
  }
  return result;
}

interface BuildQueriesParams {
  namespace: string;
  podNames: string[];
}

interface BuildRangeQueriesParams extends BuildQueriesParams {
  /**
   * Range-vector window for both `rate()` and `increase()` queries, e.g.
   * "300s". Derive from `deriveRateWindow(step)`. Restart/OOM `increase()`
   * uses the same window so each datapoint reflects events in a bounded
   * trailing interval rather than the full selected range (which would
   * produce a rising plateau across the whole chart).
   */
  lookbackWindow: string;
}

export const RANGE_METRIC_KEYS = [
  "cpu",
  "memory",
  "memoryRss",
  "memoryCache",
  "restarts",
  "networkRx",
  "networkTx",
  "diskReadBytes",
  "diskWriteBytes",
  "oomEvents",
  "cpuRequests",
  "cpuLimits",
  "memoryRequests",
  "memoryLimits",
  "cpuThrottledPeriods",
  "cpuPeriods",
] as const;

export type RangeMetricKey = (typeof RANGE_METRIC_KEYS)[number];

function buildPodRegex(podNames: string[]): string {
  return `^(${podNames.map(escapeRegex).join("|")})$`;
}

/**
 * Build every range-query PromQL string the dashboard needs. Only `namespace`
 * and `podNames` are interpolated; everything else is fixed text. `namespace`
 * is already validated by Zod (RFC-1123). `podNames` are regex-escaped and
 * anchored here.
 *
 * Precondition: callers must not pass an empty `podNames` array (the resulting
 * `pod=~""` selector matches nothing). The procedure handler short-circuits
 * before calling this util when zero pods match.
 */
export function buildPromQLQueries({
  namespace,
  podNames,
  lookbackWindow,
}: BuildRangeQueriesParams): Record<RangeMetricKey, string> {
  const podRegex = buildPodRegex(podNames);
  const base = `namespace="${namespace}", pod=~"${podRegex}"`;
  const sel = `${base}, container!="", container!="POD"`;

  return {
    cpu: `sum by (pod) (rate(container_cpu_usage_seconds_total{${sel}}[${lookbackWindow}]))`,
    memory: `sum by (pod) (container_memory_working_set_bytes{${sel}})`,
    memoryRss: `sum by (pod) (container_memory_rss{${sel}})`,
    memoryCache: `sum by (pod) (container_memory_cache{${sel}})`,
    restarts: `sum by (pod) (increase(kube_pod_container_status_restarts_total{${base}}[${lookbackWindow}]))`,
    networkRx: `sum by (pod) (rate(container_network_receive_bytes_total{${base}}[${lookbackWindow}]))`,
    networkTx: `sum by (pod) (rate(container_network_transmit_bytes_total{${base}}[${lookbackWindow}]))`,
    diskReadBytes: `sum by (pod) (rate(container_fs_reads_bytes_total{${sel}}[${lookbackWindow}]))`,
    diskWriteBytes: `sum by (pod) (rate(container_fs_writes_bytes_total{${sel}}[${lookbackWindow}]))`,
    oomEvents: `sum by (pod) (increase(container_oom_events_total{${base}}[${lookbackWindow}]))`,
    cpuRequests: `sum by (pod) (kube_pod_container_resource_requests{${base}, resource="cpu"})`,
    cpuLimits: `sum by (pod) (kube_pod_container_resource_limits{${base}, resource="cpu"})`,
    memoryRequests: `sum by (pod) (kube_pod_container_resource_requests{${base}, resource="memory"})`,
    memoryLimits: `sum by (pod) (kube_pod_container_resource_limits{${base}, resource="memory"})`,
    cpuThrottledPeriods: `sum by (pod) (rate(container_cpu_cfs_throttled_periods_total{${sel}}[${lookbackWindow}]))`,
    cpuPeriods: `sum by (pod) (rate(container_cpu_cfs_periods_total{${sel}}[${lookbackWindow}]))`,
  };
}

/** Build the single instant-query string for current pod phase. */
export function buildPodPhaseQuery({ namespace, podNames }: BuildQueriesParams): string {
  const podRegex = buildPodRegex(podNames);
  return `kube_pod_status_phase{namespace="${namespace}", pod=~"${podRegex}"} == 1`;
}

/**
 * Convert a Prometheus matrix into per-app aggregated series. For each
 * timestamp present in any of an app's pod series, sum the values across that
 * app's pods. Apps with no matched pod series are present in the output with
 * an empty series array. Output order matches `knownApps`.
 */
export function matrixToSeriesByApp(
  matrix: PromQLMatrixResponse,
  podToApp: Map<string, string>,
  knownApps: string[]
): MetricSeriesByApp[] {
  const perApp = new Map<string, Map<number, number>>();
  for (const app of knownApps) perApp.set(app, new Map());

  for (const row of matrix.data.result) {
    const podName = row.metric.pod;
    if (!podName) continue;
    const app = podToApp.get(podName);
    if (!app) continue;
    const bucket = perApp.get(app);
    if (!bucket) continue;
    for (const [ts, value] of row.values) {
      if (value === "") continue;
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) continue;
      bucket.set(ts, (bucket.get(ts) ?? 0) + numeric);
    }
  }

  return knownApps.map((app) => {
    const bucket = perApp.get(app)!;
    const sortedTs = [...bucket.keys()].sort((a, b) => a - b);
    return {
      app,
      series: sortedTs.map((t) => ({ t, v: bucket.get(t)! })),
    };
  });
}

const KNOWN_PHASES: ReadonlySet<PodPhase> = new Set(podPhaseSchema.options);

function coercePhase(value: string | undefined): PodPhase {
  return value && KNOWN_PHASES.has(value as PodPhase) ? (value as PodPhase) : "Unknown";
}

/**
 * Convert a `kube_pod_status_phase{...} == 1` vector into per-app pod-phase
 * lists. Each series has labels `pod` and `phase`; we group by app via the
 * shared podToApp map. Pods present in podToApp but missing from the vector
 * are not added (Prometheus only emits the matching phase).
 */
/**
 * Combine two per-app series into a per-app ratio series, expressed as a
 * percentage (`100 * num / den`). Designed for "saturation"-style metrics like
 * CPU throttling where summing the underlying counters then dividing is the
 * mathematically correct rollup (you cannot meaningfully average ratios).
 *
 * Output preserves `numerator`'s app order. For each app, the result series
 * contains a point only at timestamps where both numerator and denominator
 * have a finite value AND the denominator is strictly positive. Apps absent
 * from the denominator emit an empty series — mirrors the "no capacity
 * configured → no data" semantic used by the client-side `computeUtilization`
 * helper for stat panels.
 */
export function combineRatioSeriesByApp(
  numerator: MetricSeriesByApp[],
  denominator: MetricSeriesByApp[]
): MetricSeriesByApp[] {
  const denByApp = new Map<string, Map<number, number>>();
  for (const entry of denominator) {
    const points = new Map<number, number>();
    for (const point of entry.series) points.set(point.t, point.v);
    denByApp.set(entry.app, points);
  }

  return numerator.map(({ app, series }) => {
    const denPoints = denByApp.get(app);
    if (!denPoints || denPoints.size === 0) return { app, series: [] };
    const points: { t: number; v: number }[] = [];
    for (const { t, v } of series) {
      const den = denPoints.get(t);
      if (den === undefined) continue;
      if (!Number.isFinite(v) || !Number.isFinite(den) || den <= 0) continue;
      points.push({ t, v: (100 * v) / den });
    }
    return { app, series: points };
  });
}

export function vectorToPodPhaseByApp(
  vector: PromQLVectorResponse,
  podToApp: Map<string, string>,
  knownApps: string[]
): PodPhaseByApp[] {
  const perApp = new Map<string, { name: string; phase: PodPhase }[]>();
  for (const app of knownApps) perApp.set(app, []);

  for (const row of vector.data.result) {
    const podName = row.metric.pod;
    if (!podName) continue;
    const app = podToApp.get(podName);
    if (!app) continue;
    const bucket = perApp.get(app);
    if (!bucket) continue;
    bucket.push({ name: podName, phase: coercePhase(row.metric.phase) });
  }

  return knownApps.map((app) => ({ app, pods: perApp.get(app)! }));
}
