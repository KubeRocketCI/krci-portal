import { z } from "zod";
import { METRIC_RANGE_VALUES, MAX_APPLICATIONS } from "./constants.js";

// namespace must match RFC-1123 to be safe inside the templated PromQL.
export const deploymentMetricsInputSchema = z
  .object({
    clusterName: z.string().min(1),
    namespace: z
      .string()
      .min(1)
      .regex(
        /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/,
        "namespace must match RFC-1123 DNS label (lowercase alphanumeric, optional hyphens, max 63 chars, must start and end with alphanumeric)"
      ),
    applications: z.array(z.string().min(1)).max(MAX_APPLICATIONS),
    range: z.enum(METRIC_RANGE_VALUES),
  })
  .strict();

export const metricSeriesPointSchema = z.object({
  t: z.number(), // unix seconds
  v: z.number(),
});

export const metricSeriesByAppSchema = z.object({
  app: z.string(),
  series: z.array(metricSeriesPointSchema),
});

export const deploymentMetricsOutputSchema = z.object({
  cpu: z.array(metricSeriesByAppSchema),
  memory: z.array(metricSeriesByAppSchema),
  restarts: z.array(metricSeriesByAppSchema),
  range: z.enum(METRIC_RANGE_VALUES),
  queriedAt: z.number(),
});

// Minimal subset of Prometheus query_range matrix shape used for response validation.
export const promqlMatrixResponseSchema = z.object({
  status: z.literal("success"),
  data: z.object({
    resultType: z.literal("matrix"),
    result: z.array(
      z.object({
        metric: z.record(z.string(), z.string()),
        values: z.array(z.tuple([z.number(), z.string()])),
      })
    ),
  }),
});
