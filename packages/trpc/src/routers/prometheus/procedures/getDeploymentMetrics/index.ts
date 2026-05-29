import { TRPCError } from "@trpc/server";
import {
  deploymentMetricsInputSchema,
  deploymentMetricsOutputSchema,
  k8sPodConfig,
  podLabels,
  POD_LABEL_APP_INSTANCE,
  STEP_BY_RANGE,
  PROMETHEUS_TIME_RANGES,
  type DeploymentMetricsOutput,
  type MetricSeriesByApp,
  type PodPhaseByApp,
  type PromQLMatrixResponse,
  type PromQLVectorResponse,
} from "@my-project/shared";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { createPrometheusClient } from "../../../../clients/prometheus/index.js";
import { getInitializedK8sClient } from "../../../k8s/utils/getInitializedK8sClient/index.js";
import {
  buildPodPhaseQuery,
  buildPodNamePromQLQueries,
  buildPromQLQueries,
  combineRatioSeriesByApp,
  deriveRateWindow,
  groupPodsByApp,
  matrixToPodSeriesByApp,
  matrixToPodSeriesByAppFromMap,
  RANGE_METRIC_KEYS,
  vectorToPodPhaseByApp,
  type RangeMetricKey,
} from "./utils.js";

// Wall-clock deadline for the entire range+instant query bundle. Above
// PROMETHEUS_TIMEOUT_MS (10 s) so a single slow query can still fail per-query
// while the bundle as a whole has bounded latency.
const PROMETHEUS_BUDGET_MS = 15_000;

function emptyOutput(
  range: DeploymentMetricsOutput["range"],
  queriedAt: number,
  apps: string[]
): DeploymentMetricsOutput {
  const empty = (): MetricSeriesByApp[] => apps.map((app) => ({ app, pods: [] }));
  const emptyPhase = (): PodPhaseByApp[] => apps.map((app) => ({ app, pods: [] }));
  return {
    compute: {
      cpu: empty(),
      memory: empty(),
      memoryRss: empty(),
      memoryCache: empty(),
      cpuThrottling: empty(),
    },
    network: { rx: empty(), tx: empty() },
    storage: { readBytes: empty(), writeBytes: empty() },
    health: { restarts: empty(), oomEvents: empty(), podPhase: emptyPhase() },
    quotas: {
      cpuRequests: empty(),
      cpuLimits: empty(),
      memoryRequests: empty(),
      memoryLimits: empty(),
    },
    range,
    queriedAt,
  };
}

export const getDeploymentMetricsProcedure = protectedProcedure
  .input(deploymentMetricsInputSchema)
  .output(deploymentMetricsOutputSchema)
  .query(async ({ input, ctx }): Promise<DeploymentMetricsOutput> => {
    // `clusterName` is part of the input for client-side cache-key stability;
    // server uses a single PROMETHEUS_URL and resolves the cluster via session.
    const { namespace, applications, range } = input;
    const queriedAt = Math.floor(Date.now() / 1000);

    if (applications.length === 0) {
      return emptyOutput(range, queriedAt, []);
    }

    const k8sClient = getInitializedK8sClient(ctx);

    // K8s pod listing is still needed for the live-only podPhase panel.
    // Range queries no longer depend on it — they vector-match against
    // kube_pod_labels server-side and so include historical pods.
    const labelSelector = `${podLabels.instance} in (${applications.join(",")})`;
    const podList = await k8sClient.listResource(k8sPodConfig, namespace, labelSelector);
    const podsByApp = groupPodsByApp(
      (podList.items ?? []) as Array<{ metadata: { name: string; labels?: Record<string, string> } }>,
      applications
    );
    const livePodToApp = new Map<string, string>();
    const livePodNames: string[] = [];
    for (const [app, pods] of podsByApp) {
      for (const podName of pods) {
        livePodToApp.set(podName, app);
        livePodNames.push(podName);
      }
    }

    const end = queriedAt;
    const step = STEP_BY_RANGE[range];
    const rangeSeconds = PROMETHEUS_TIME_RANGES[range];
    const start = end - rangeSeconds;

    const prometheus = createPrometheusClient();
    const sharedAbort = new AbortController();
    // Wall-clock deadline for the whole bundle. Combined with the per-query
    // timeout inside fetchJson via AbortSignal.any, so a single slow query is
    // bounded by min(PROMETHEUS_TIMEOUT_MS, remaining budget).
    const budgetSignal = AbortSignal.timeout(PROMETHEUS_BUDGET_MS);
    const combinedSignal = AbortSignal.any([sharedAbort.signal, budgetSignal]);
    const procedureStart = Date.now();

    // Probe whether kube-state-metrics exposes kube_pod_labels for this
    // namespace. Requires --metric-labels-allowlist=pods=[app.kubernetes.io/instance]
    // on the KSM deployment; absent on many stock installations. When the metric
    // is present we can use the kube_pod_labels join (includes historical pods);
    // otherwise we fall back to filtering by live pod names from the K8s listing.
    const kubePodLabelsProbe = await prometheus.instantQuery(
      {
        query: `count(kube_pod_labels{namespace="${namespace}", ${POD_LABEL_APP_INSTANCE}!=""})`,
      },
      combinedSignal
    );
    const hasKubePodLabels =
      kubePodLabelsProbe.data.result.length > 0 && Number(kubePodLabelsProbe.data.result[0]?.value[1]) > 0;

    // Without kube_pod_labels AND no live pods there is nothing to query.
    if (!hasKubePodLabels && livePodNames.length === 0) {
      return emptyOutput(range, queriedAt, applications);
    }

    const queries = hasKubePodLabels
      ? buildPromQLQueries({ namespace, applications, lookbackWindow: deriveRateWindow(step) })
      : buildPodNamePromQLQueries({ namespace, podNames: livePodNames, lookbackWindow: deriveRateWindow(step) });

    let rangeResults: PromQLMatrixResponse[];
    let phaseVector: PromQLVectorResponse;
    try {
      // TODO(M-6): consider Promise.allSettled so partial section failures
      // surface per section instead of failing the whole bundle.
      const rangePromises = RANGE_METRIC_KEYS.map((key) =>
        prometheus.rangeQuery({ query: queries[key], start, end, step }, combinedSignal)
      );
      // podPhase is intrinsically about live pods. Skip the instant query
      // when no live pods match — Prometheus would return an empty vector
      // and an empty pod regex would be malformed.
      const phasePromise: Promise<PromQLVectorResponse> =
        livePodNames.length === 0
          ? Promise.resolve({ status: "success", data: { resultType: "vector", result: [] } })
          : prometheus.instantQuery(
              { query: buildPodPhaseQuery({ namespace, podNames: livePodNames }) },
              combinedSignal
            );
      [rangeResults, phaseVector] = await Promise.all([Promise.all(rangePromises), phasePromise]);
    } catch (error) {
      sharedAbort.abort();
      if (error instanceof TRPCError) throw error;
      const message = error instanceof Error ? error.message : String(error);
      if (/timed out/i.test(message)) {
        throw new TRPCError({ code: "GATEWAY_TIMEOUT", message, cause: error });
      }
      throw new TRPCError({
        code: "BAD_GATEWAY",
        message: `Prometheus upstream failure: ${message}`,
        cause: error,
      });
    } finally {
      console.info(
        `[prometheus.getDeploymentMetrics] range=${range} apps=${applications.length} livePods=${livePodNames.length} hasKubePodLabels=${hasKubePodLabels} durationMs=${Date.now() - procedureStart}`
      );
    }

    const resultByKey = new Map<RangeMetricKey, PromQLMatrixResponse>(
      RANGE_METRIC_KEYS.map((key, idx) => [key, rangeResults[idx]!])
    );
    const seriesFor = (key: RangeMetricKey): MetricSeriesByApp[] =>
      hasKubePodLabels
        ? matrixToPodSeriesByApp(resultByKey.get(key)!, applications)
        : matrixToPodSeriesByAppFromMap(resultByKey.get(key)!, livePodToApp, applications);

    return {
      compute: {
        cpu: seriesFor("cpu"),
        memory: seriesFor("memory"),
        memoryRss: seriesFor("memoryRss"),
        memoryCache: seriesFor("memoryCache"),
        cpuThrottling: combineRatioSeriesByApp(seriesFor("cpuThrottledPeriods"), seriesFor("cpuPeriods")),
      },
      network: {
        rx: seriesFor("networkRx"),
        tx: seriesFor("networkTx"),
      },
      storage: {
        readBytes: seriesFor("diskReadBytes"),
        writeBytes: seriesFor("diskWriteBytes"),
      },
      health: {
        restarts: seriesFor("restarts"),
        oomEvents: seriesFor("oomEvents"),
        podPhase: vectorToPodPhaseByApp(phaseVector, livePodToApp, applications),
      },
      quotas: {
        cpuRequests: seriesFor("cpuRequests"),
        cpuLimits: seriesFor("cpuLimits"),
        memoryRequests: seriesFor("memoryRequests"),
        memoryLimits: seriesFor("memoryLimits"),
      },
      range,
      queriedAt,
    };
  });
