import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { createPrometheusClient } from "../../../../clients/prometheus/index.js";
import { escapeRegex } from "../getDeploymentMetrics/utils.js";
import { aggregateExposure } from "./utils.js";

// Whole-bundle ceiling: below the per-request 10 s client timeout so this
// signal can fire before an individual query hangs the whole bundle.
const EXPOSURE_BUDGET_MS = 12_000;

const exposureMetricsInputSchema = z.object({
  // clusterName: client cache-key only; server resolves Prometheus via PROMETHEUS_URL.
  clusterName: z.string(),
  namespace: z
    .string()
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/)
    .max(63),
  // gatewayNames: reserved for future per-gateway scoping; not yet filtered server-side.
  gatewayNames: z.array(z.string()).optional(),
});

const exposureBackendSchema = z.object({
  key: z.string(),
  routeNamespace: z.string(),
  routeName: z.string(),
  rps: z.number(),
  successPct: z.number(),
});

const exposureMetricsOutputSchema = z.object({
  backends: z.array(exposureBackendSchema),
  queriedAt: z.number(),
});

export const getExposureMetricsProcedure = protectedProcedure
  .input(exposureMetricsInputSchema)
  .output(exposureMetricsOutputSchema)
  .query(async ({ input }) => {
    const { namespace } = input;
    const queriedAt = Math.floor(Date.now() / 1000);
    const procedureStart = Date.now();

    // Throws PRECONDITION_FAILED if PROMETHEUS_URL is unset — let it propagate.
    const prometheus = createPrometheusClient();

    const nsEscaped = escapeRegex(namespace);

    const clusterSelector = `envoy_cluster_name=~"httproute/${nsEscaped}/.+/rule/[0-9]+"`;

    const rpsQuery = `sum by (envoy_cluster_name) (rate(envoy_cluster_upstream_rq_total{${clusterSelector}}[2m]))`;
    const successQuery = `sum by (envoy_cluster_name) (rate(envoy_cluster_upstream_rq_xx{${clusterSelector}, envoy_response_code_class=~"2|3"}[2m]))`;

    const budgetSignal = AbortSignal.timeout(EXPOSURE_BUDGET_MS);

    let backends: ReturnType<typeof aggregateExposure>;
    try {
      const [rpsRes, successRes] = await Promise.all([
        prometheus.instantQuery({ query: rpsQuery }, budgetSignal),
        prometheus.instantQuery({ query: successQuery }, budgetSignal),
      ]);

      backends = aggregateExposure({
        rps: rpsRes.data.result,
        success: successRes.data.result,
      });
    } catch (error) {
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
      console.info(`[prometheus.getExposureMetrics] namespace=${namespace} durationMs=${Date.now() - procedureStart}`);
    }

    return { backends, queriedAt };
  });
