import {
  podLabels,
  podPhaseSchema,
  sortByName,
  POD_LABEL_APP_INSTANCE,
  type PromQLMatrixResponse,
  type PromQLVectorResponse,
  type MetricSeriesByApp,
  type MetricSeriesByPod,
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

interface BuildRangeQueriesParams {
  namespace: string;
  /** RFC-1123-constrained app names (validated by Zod at the schema). */
  applications: string[];
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

function buildRegexAlternation(values: string[]): string {
  return `^(${values.map(escapeRegex).join("|")})$`;
}

/**
 * Build every range-query PromQL string the dashboard needs. Each query
 * vector-matches against `kube_pod_labels` so the result includes any pod
 * (current or historical, within KSM retention) whose
 * `app.kubernetes.io/instance` label matches `applications`. The
 * `${POD_LABEL_APP_INSTANCE}` label is preserved through the
 * `group_left(...)` clause so each output series carries both `pod` and
 * the app it belonged to.
 *
 * `namespace` and `applications` are validated by Zod (RFC-1123) at the
 * tRPC boundary; `applications` are additionally regex-escaped here.
 *
 * Precondition: callers must not pass an empty `applications` array.
 * Only use when `kube_pod_labels` is confirmed available — see
 * `buildPodNamePromQLQueries` for the fallback.
 */
export function buildPromQLQueries({
  namespace,
  applications,
  lookbackWindow,
}: BuildRangeQueriesParams): Record<RangeMetricKey, string> {
  // `namespace` goes only into PromQL equality matchers (`namespace="…"`).
  // Zod's RFC-1123 regex constrains it to `[a-z0-9-]`, none of which are
  // metacharacters in a double-quoted PromQL string, so no escaping is
  // required. `applications` below DO need `escapeRegex()` because they
  // are placed into a `=~` regex matcher.
  const baseSel = `namespace="${namespace}"`;
  const containerSel = `${baseSel}, container!="", container!="POD"`;
  const join = `* on (namespace, pod) group_left(${POD_LABEL_APP_INSTANCE}) kube_pod_labels{namespace="${namespace}", ${POD_LABEL_APP_INSTANCE}=~"${buildRegexAlternation(applications)}"}`;
  const wrap = (inner: string): string => `sum by (pod, ${POD_LABEL_APP_INSTANCE}) (${inner} ${join})`;

  return {
    cpu: wrap(`rate(container_cpu_usage_seconds_total{${containerSel}}[${lookbackWindow}])`),
    memory: wrap(`container_memory_working_set_bytes{${containerSel}}`),
    memoryRss: wrap(`container_memory_rss{${containerSel}}`),
    memoryCache: wrap(`container_memory_cache{${containerSel}}`),
    restarts: wrap(`increase(kube_pod_container_status_restarts_total{${baseSel}}[${lookbackWindow}])`),
    networkRx: wrap(`rate(container_network_receive_bytes_total{${baseSel}}[${lookbackWindow}])`),
    networkTx: wrap(`rate(container_network_transmit_bytes_total{${baseSel}}[${lookbackWindow}])`),
    diskReadBytes: wrap(`rate(container_fs_reads_bytes_total{${containerSel}}[${lookbackWindow}])`),
    diskWriteBytes: wrap(`rate(container_fs_writes_bytes_total{${containerSel}}[${lookbackWindow}])`),
    oomEvents: wrap(`increase(container_oom_events_total{${baseSel}}[${lookbackWindow}])`),
    cpuRequests: wrap(`kube_pod_container_resource_requests{${baseSel}, resource="cpu"}`),
    cpuLimits: wrap(`kube_pod_container_resource_limits{${baseSel}, resource="cpu"}`),
    memoryRequests: wrap(`kube_pod_container_resource_requests{${baseSel}, resource="memory"}`),
    memoryLimits: wrap(`kube_pod_container_resource_limits{${baseSel}, resource="memory"}`),
    cpuThrottledPeriods: wrap(`rate(container_cpu_cfs_throttled_periods_total{${containerSel}}[${lookbackWindow}])`),
    cpuPeriods: wrap(`rate(container_cpu_cfs_periods_total{${containerSel}}[${lookbackWindow}])`),
  };
}

/**
 * Fallback query builder for clusters where `kube_pod_labels` is not exposed
 * by kube-state-metrics (requires `--metric-labels-allowlist` to enable).
 * Filters by pod names from the live K8s listing instead of joining against
 * `kube_pod_labels`. Results carry only the `pod` label; use
 * `matrixToPodSeriesByAppFromMap` to group them by app.
 *
 * Precondition: `podNames` must be non-empty.
 */
export function buildPodNamePromQLQueries({
  namespace,
  podNames,
  lookbackWindow,
}: {
  namespace: string;
  podNames: string[];
  lookbackWindow: string;
}): Record<RangeMetricKey, string> {
  const podRegex = buildRegexAlternation(podNames);
  const baseSel = `namespace="${namespace}", pod=~"${podRegex}"`;
  const containerSel = `${baseSel}, container!="", container!="POD"`;
  const wrap = (inner: string): string => `sum by (pod) (${inner})`;

  return {
    cpu: wrap(`rate(container_cpu_usage_seconds_total{${containerSel}}[${lookbackWindow}])`),
    memory: wrap(`container_memory_working_set_bytes{${containerSel}}`),
    memoryRss: wrap(`container_memory_rss{${containerSel}}`),
    memoryCache: wrap(`container_memory_cache{${containerSel}}`),
    restarts: wrap(`increase(kube_pod_container_status_restarts_total{${baseSel}}[${lookbackWindow}])`),
    networkRx: wrap(`rate(container_network_receive_bytes_total{${baseSel}}[${lookbackWindow}])`),
    networkTx: wrap(`rate(container_network_transmit_bytes_total{${baseSel}}[${lookbackWindow}])`),
    diskReadBytes: wrap(`rate(container_fs_reads_bytes_total{${containerSel}}[${lookbackWindow}])`),
    diskWriteBytes: wrap(`rate(container_fs_writes_bytes_total{${containerSel}}[${lookbackWindow}])`),
    oomEvents: wrap(`increase(container_oom_events_total{${baseSel}}[${lookbackWindow}])`),
    cpuRequests: wrap(`kube_pod_container_resource_requests{${baseSel}, resource="cpu"}`),
    cpuLimits: wrap(`kube_pod_container_resource_limits{${baseSel}, resource="cpu"}`),
    memoryRequests: wrap(`kube_pod_container_resource_requests{${baseSel}, resource="memory"}`),
    memoryLimits: wrap(`kube_pod_container_resource_limits{${baseSel}, resource="memory"}`),
    cpuThrottledPeriods: wrap(`rate(container_cpu_cfs_throttled_periods_total{${containerSel}}[${lookbackWindow}])`),
    cpuPeriods: wrap(`rate(container_cpu_cfs_periods_total{${containerSel}}[${lookbackWindow}])`),
  };
}

/** Build the single instant-query string for current pod phase. */
export function buildPodPhaseQuery({ namespace, podNames }: { namespace: string; podNames: string[] }): string {
  return `kube_pod_status_phase{namespace="${namespace}", pod=~"${buildRegexAlternation(podNames)}"} == 1`;
}

/**
 * Convert a Prometheus matrix into per-app, per-pod series. Each input
 * series is identified by its `pod` label and partitioned by the
 * `label_app_kubernetes_io_instance` label (see
 * `POD_LABEL_APP_INSTANCE`). Pods whose app label is not in `knownApps`
 * are dropped (defensive — the PromQL regex should already restrict
 * this). Output preserves `knownApps` order; pods within each app are
 * sorted by name for stable rendering.
 */
export function matrixToPodSeriesByApp(matrix: PromQLMatrixResponse, knownApps: string[]): MetricSeriesByApp[] {
  const perAppPods = new Map<string, Map<string, MetricSeriesByPod["series"]>>();
  for (const app of knownApps) perAppPods.set(app, new Map());

  for (const row of matrix.data.result) {
    const podName = row.metric.pod;
    const app = row.metric[POD_LABEL_APP_INSTANCE];
    if (!podName || !app) continue;
    const podMap = perAppPods.get(app);
    if (!podMap) continue;
    const points: MetricSeriesByPod["series"] = [];
    for (const [t, value] of row.values) {
      if (value === "") continue;
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) continue;
      points.push({ t, v: numeric });
    }
    // Each PromQL query is `sum by (pod, label_app_kubernetes_io_instance)`,
    // which guarantees one row per (pod, app) tuple. Last-write-wins here
    // is therefore safe; a duplicate would indicate a Prometheus
    // correctness bug rather than expected traffic.
    podMap.set(podName, points);
  }

  return knownApps.map((app) => {
    const podMap = perAppPods.get(app)!;
    const sortedPodNames = [...podMap.keys()].sort(sortByName);
    return {
      app,
      pods: sortedPodNames.map((pod) => ({ pod, series: podMap.get(pod)! })),
    };
  });
}

/**
 * Fallback counterpart of `matrixToPodSeriesByApp` for clusters where the
 * `kube_pod_labels` join is not available. Series carry only the `pod` label;
 * the app is resolved via the live `podToApp` map from the K8s listing.
 * Pods not present in `podToApp` are dropped.
 */
export function matrixToPodSeriesByAppFromMap(
  matrix: PromQLMatrixResponse,
  podToApp: Map<string, string>,
  knownApps: string[]
): MetricSeriesByApp[] {
  const perAppPods = new Map<string, Map<string, MetricSeriesByPod["series"]>>();
  for (const app of knownApps) perAppPods.set(app, new Map());

  for (const row of matrix.data.result) {
    const podName = row.metric.pod;
    if (!podName) continue;
    const app = podToApp.get(podName);
    if (!app) continue;
    const podMap = perAppPods.get(app);
    if (!podMap) continue;
    const points: MetricSeriesByPod["series"] = [];
    for (const [t, value] of row.values) {
      if (value === "") continue;
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) continue;
      points.push({ t, v: numeric });
    }
    podMap.set(podName, points);
  }

  return knownApps.map((app) => {
    const podMap = perAppPods.get(app)!;
    const sortedPodNames = [...podMap.keys()].sort(sortByName);
    return {
      app,
      pods: sortedPodNames.map((pod) => ({ pod, series: podMap.get(pod)! })),
    };
  });
}

const KNOWN_PHASES: ReadonlySet<PodPhase> = new Set(podPhaseSchema.options);

function coercePhase(value: string | undefined): PodPhase {
  return value && KNOWN_PHASES.has(value as PodPhase) ? (value as PodPhase) : "Unknown";
}

/**
 * Combine two per-pod series into a per-pod ratio series, expressed as a
 * percentage (`100 * num / den`). For each app in `numerator`, for each
 * pod, the result emits a point at every timestamp where both numerator
 * and denominator have a finite value AND the denominator is strictly
 * positive. Apps and pods missing from the denominator emit empty
 * series — mirrors the "no capacity configured → no data" semantic
 * used by the client-side `computeUtilization` helper.
 */
export function combineRatioSeriesByApp(
  numerator: MetricSeriesByApp[],
  denominator: MetricSeriesByApp[]
): MetricSeriesByApp[] {
  const denByAppPod = new Map<string, Map<string, Map<number, number>>>();
  for (const entry of denominator) {
    const podMap = new Map<string, Map<number, number>>();
    for (const pod of entry.pods) {
      const points = new Map<number, number>();
      for (const p of pod.series) points.set(p.t, p.v);
      podMap.set(pod.pod, points);
    }
    denByAppPod.set(entry.app, podMap);
  }

  return numerator.map(({ app, pods }) => {
    const denPods = denByAppPod.get(app);
    return {
      app,
      pods: pods.map(({ pod, series }) => {
        const denPoints = denPods?.get(pod);
        if (!denPoints || denPoints.size === 0) return { pod, series: [] };
        const out: { t: number; v: number }[] = [];
        for (const { t, v } of series) {
          const den = denPoints.get(t);
          if (den === undefined) continue;
          if (!Number.isFinite(v) || !Number.isFinite(den) || den <= 0) continue;
          out.push({ t, v: (100 * v) / den });
        }
        return { pod, series: out };
      }),
    };
  });
}

/**
 * Convert a `kube_pod_status_phase{...} == 1` vector into per-app pod-phase
 * lists. Each series has labels `pod` and `phase`; we group by app via the
 * shared podToApp map (built from the live K8s pod list, since podPhase is
 * intrinsically about currently running pods). Pods present in podToApp
 * but missing from the vector are not added (Prometheus only emits the
 * matching phase).
 */
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
