import { z } from "zod";
import { METRIC_RANGE_VALUES, MAX_APPLICATIONS } from "./constants.js";

const RFC_1123_LABEL_REGEX = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
const RFC_1123_LABEL_MESSAGE =
  "must match RFC-1123 DNS label (lowercase alphanumeric, optional hyphens, max 63 chars, must start and end with alphanumeric)";

// namespace and application names are interpolated into PromQL and K8s label
// selectors; constraining them to RFC-1123 at the schema boundary is the
// single source of truth for that invariant.
export const deploymentMetricsInputSchema = z
  .object({
    clusterName: z.string().min(1),
    namespace: z.string().min(1).regex(RFC_1123_LABEL_REGEX, `namespace ${RFC_1123_LABEL_MESSAGE}`),
    applications: z
      .array(z.string().min(1).regex(RFC_1123_LABEL_REGEX, `application name ${RFC_1123_LABEL_MESSAGE}`))
      .max(MAX_APPLICATIONS),
    range: z.enum(METRIC_RANGE_VALUES),
  })
  .strict();

export const metricSeriesPointSchema = z.object({
  t: z.number().int().nonnegative(), // unix seconds
  v: z.number().finite(),
});

export const metricSeriesByAppSchema = z.object({
  app: z.string(),
  series: z.array(metricSeriesPointSchema),
});

export const podPhaseSchema = z.enum(["Pending", "Running", "Succeeded", "Failed", "Unknown"]);

export const podPhaseByAppSchema = z.object({
  app: z.string(),
  pods: z.array(
    z.object({
      name: z.string(),
      phase: podPhaseSchema,
    })
  ),
});

export const deploymentMetricsOutputSchema = z.object({
  compute: z.object({
    cpu: z.array(metricSeriesByAppSchema), // cores
    memory: z.array(metricSeriesByAppSchema), // bytes (working set)
    memoryRss: z.array(metricSeriesByAppSchema), // bytes
    memoryCache: z.array(metricSeriesByAppSchema), // bytes
    cpuThrottling: z.array(metricSeriesByAppSchema), // percent (0-100): sum throttled / sum periods × 100
  }),
  network: z.object({
    rx: z.array(metricSeriesByAppSchema), // bytes/s
    tx: z.array(metricSeriesByAppSchema), // bytes/s
  }),
  storage: z.object({
    readBytes: z.array(metricSeriesByAppSchema), // bytes/s
    writeBytes: z.array(metricSeriesByAppSchema), // bytes/s
  }),
  health: z.object({
    restarts: z.array(metricSeriesByAppSchema), // events in selected range (increase)
    oomEvents: z.array(metricSeriesByAppSchema), // events in selected range (increase)
    podPhase: z.array(podPhaseByAppSchema),
  }),
  quotas: z.object({
    cpuRequests: z.array(metricSeriesByAppSchema), // cores
    cpuLimits: z.array(metricSeriesByAppSchema), // cores
    memoryRequests: z.array(metricSeriesByAppSchema), // bytes
    memoryLimits: z.array(metricSeriesByAppSchema), // bytes
  }),
  range: z.enum(METRIC_RANGE_VALUES),
  queriedAt: z.number().int().nonnegative(),
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

// Minimal subset of Prometheus instant-query vector shape.
export const promqlVectorResponseSchema = z.object({
  status: z.literal("success"),
  data: z.object({
    resultType: z.literal("vector"),
    result: z.array(
      z.object({
        metric: z.record(z.string(), z.string()),
        value: z.tuple([z.number(), z.string()]),
      })
    ),
  }),
});
