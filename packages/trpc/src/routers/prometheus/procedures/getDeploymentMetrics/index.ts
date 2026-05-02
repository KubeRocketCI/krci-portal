import { TRPCError } from "@trpc/server";
import {
  deploymentMetricsInputSchema,
  deploymentMetricsOutputSchema,
  k8sPodConfig,
  STEP_BY_RANGE,
  PROMETHEUS_TIME_RANGES,
  type DeploymentMetricsOutput,
  type MetricSeriesByApp,
  type PromQLMatrixResponse,
} from "@my-project/shared";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { K8sClient } from "../../../../clients/k8s/index.js";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../../k8s/errors/index.js";
import { createPrometheusClient } from "../../../../clients/prometheus/index.js";
import { APP_INSTANCE_LABEL, buildPromQLQueries, groupPodsByApp, matrixToSeriesByApp } from "./utils.js";

export const getDeploymentMetricsProcedure = protectedProcedure
  .input(deploymentMetricsInputSchema)
  .output(deploymentMetricsOutputSchema)
  .query(async ({ input, ctx }): Promise<DeploymentMetricsOutput> => {
    // `clusterName` is part of the input for client-side cache-key stability;
    // server uses a single PROMETHEUS_URL and resolves the cluster via session.
    const { namespace, applications, range } = input;
    const queriedAt = Math.floor(Date.now() / 1000);

    if (applications.length === 0) {
      return { cpu: [], memory: [], restarts: [], range, queriedAt };
    }

    const k8sClient = new K8sClient(ctx.session);
    if (!k8sClient.KubeConfig) {
      throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
    }

    const labelSelector = `${APP_INSTANCE_LABEL} in (${applications.join(",")})`;
    const podList = await k8sClient.listResource(k8sPodConfig, namespace, labelSelector);

    const podsByApp = groupPodsByApp(
      (podList.items ?? []) as Array<{ metadata: { name: string; labels?: Record<string, string> } }>,
      applications
    );

    const podToApp = new Map<string, string>();
    const allPodNames: string[] = [];
    for (const [app, pods] of podsByApp) {
      for (const podName of pods) {
        podToApp.set(podName, app);
        allPodNames.push(podName);
      }
    }

    if (allPodNames.length === 0) {
      const empty: MetricSeriesByApp[] = applications.map((app) => ({ app, series: [] }));
      return { cpu: empty, memory: empty, restarts: empty, range, queriedAt };
    }

    const queries = buildPromQLQueries({ namespace, podNames: allPodNames });
    const end = queriedAt;
    const start = end - PROMETHEUS_TIME_RANGES[range];
    const step = STEP_BY_RANGE[range];

    const prometheus = createPrometheusClient();
    const sharedAbort = new AbortController();

    let cpuMatrix: PromQLMatrixResponse;
    let memMatrix: PromQLMatrixResponse;
    let restartsMatrix: PromQLMatrixResponse;
    try {
      [cpuMatrix, memMatrix, restartsMatrix] = await Promise.all([
        prometheus.rangeQuery({ query: queries.cpu, start, end, step }, sharedAbort.signal),
        prometheus.rangeQuery({ query: queries.memory, start, end, step }, sharedAbort.signal),
        prometheus.rangeQuery({ query: queries.restarts, start, end, step }, sharedAbort.signal),
      ]);
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
    }

    return {
      cpu: matrixToSeriesByApp(cpuMatrix, podToApp, applications),
      memory: matrixToSeriesByApp(memMatrix, podToApp, applications),
      restarts: matrixToSeriesByApp(restartsMatrix, podToApp, applications),
      range,
      queriedAt,
    };
  });
