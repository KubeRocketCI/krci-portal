import { TRPCError } from "@trpc/server";
import {
  pipelineRunMetricsInputSchema,
  pipelineRunMetricsOutputSchema,
  MAX_PIPELINE_RUN_WINDOW_SECONDS,
  type PipelineRunMetricsOutput,
  type PromQLMatrixResponse,
} from "@my-project/shared";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { createPrometheusClient } from "../../../../clients/prometheus/index.js";
import {
  buildPipelineRunPromQLQueries,
  combineTaskRatioSeries,
  derivePipelineRunRateWindow,
  derivePipelineRunStep,
  matrixToTaskSeries,
  PIPELINE_RUN_METRIC_KEYS,
  type PipelineRunMetricKey,
} from "./utils.js";

// Wall-clock deadline for the whole 4-query bundle; above the per-query
// PROMETHEUS_TIMEOUT_MS (10 s) so a single slow query can still fail
// individually while the bundle as a whole has bounded latency.
const PROMETHEUS_BUDGET_MS = 15_000;

/**
 * Per-step CPU / memory / CPU-throttling series for a fixed set of TaskRun
 * pods. The client resolves pods from the unified PipelineRun data (live K8s
 * watch or Tekton Results history — `TaskRun.status.podName` in both cases)
 * because only the client knows which source the run came from; pod names are
 * RFC-1123-validated and regex-escaped before entering PromQL.
 */
export const getPipelineRunMetricsProcedure = protectedProcedure
  .input(pipelineRunMetricsInputSchema)
  .output(pipelineRunMetricsOutputSchema)
  .query(async ({ input }): Promise<PipelineRunMetricsOutput> => {
    // `clusterName` is part of the input for client-side cache-key stability;
    // server uses a single PROMETHEUS_URL and resolves the cluster via session.
    const { namespace, pods } = input;
    const queriedAt = Math.floor(Date.now() / 1000);

    // `end` is omitted for in-flight runs — the window follows "now".
    const end = input.end ?? queriedAt;
    if (end <= input.start) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Query window is empty: start is not before end" });
    }
    // Clamp instead of reject: a window this long has aged past retention at
    // the far edge anyway, and clamping keeps the recent edge usable.
    const start = Math.max(input.start, end - MAX_PIPELINE_RUN_WINDOW_SECONDS);

    const step = derivePipelineRunStep(end - start);
    const podNames = [...new Set(pods.map((p) => p.podName))];

    const prometheus = createPrometheusClient();
    const sharedAbort = new AbortController();
    const budgetSignal = AbortSignal.timeout(PROMETHEUS_BUDGET_MS);
    const combinedSignal = AbortSignal.any([sharedAbort.signal, budgetSignal]);
    const procedureStart = Date.now();

    const queries = buildPipelineRunPromQLQueries({
      namespace,
      podNames,
      lookbackWindow: derivePipelineRunRateWindow(step),
    });

    let rangeResults: PromQLMatrixResponse[];
    try {
      rangeResults = await Promise.all(
        PIPELINE_RUN_METRIC_KEYS.map((key) =>
          prometheus.rangeQuery({ query: queries[key], start, end, step }, combinedSignal)
        )
      );
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
        `[prometheus.getPipelineRunMetrics] pods=${podNames.length} windowSec=${end - start} step=${step} durationMs=${Date.now() - procedureStart}`
      );
    }

    const resultByKey = new Map<PipelineRunMetricKey, PromQLMatrixResponse>(
      PIPELINE_RUN_METRIC_KEYS.map((key, idx) => [key, rangeResults[idx]!])
    );
    const seriesFor = (key: PipelineRunMetricKey) => matrixToTaskSeries(resultByKey.get(key)!, pods);

    return {
      cpu: seriesFor("cpu"),
      memory: seriesFor("memory"),
      cpuThrottling: combineTaskRatioSeries(seriesFor("cpuThrottledPeriods"), seriesFor("cpuPeriods")),
      start,
      end,
      step,
      queriedAt,
    };
  });
