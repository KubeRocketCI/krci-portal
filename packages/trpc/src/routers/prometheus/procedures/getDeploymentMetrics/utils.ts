import type { PromQLMatrixResponse, MetricSeriesByApp } from "@my-project/shared";

export const APP_INSTANCE_LABEL = "app.kubernetes.io/instance";

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
    const label = pod.metadata.labels?.[APP_INSTANCE_LABEL];
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

/**
 * Build the three PromQL queries used by the dashboard. Only `namespace` and
 * `podNames` are interpolated; everything else is fixed text. `namespace` is
 * already validated by Zod (RFC-1123). `podNames` are regex-escaped here.
 *
 * Precondition: callers must not pass an empty `podNames` array. With no pod
 * names, the resulting `pod=~""` selector matches nothing, which produces a
 * structurally-valid but semantically-degenerate query. The procedure handler
 * short-circuits before calling this util when zero pods match.
 */
export function buildPromQLQueries({ namespace, podNames }: BuildQueriesParams): {
  cpu: string;
  memory: string;
  restarts: string;
} {
  const podRegex = podNames.map(escapeRegex).join("|");
  const baseSelector = `namespace="${namespace}", pod=~"${podRegex}"`;
  const containerSelector = `${baseSelector}, container!="", container!="POD"`;
  return {
    cpu: `sum by (pod) (rate(container_cpu_usage_seconds_total{${containerSelector}}[5m]))`,
    memory: `sum by (pod) (container_memory_working_set_bytes{${containerSelector}})`,
    restarts: `sum by (pod) (kube_pod_container_status_restarts_total{${baseSelector}})`,
  };
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
      const numeric = Number(value);
      if (Number.isNaN(numeric)) continue;
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
