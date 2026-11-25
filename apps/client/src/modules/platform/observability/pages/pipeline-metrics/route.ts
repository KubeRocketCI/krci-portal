import { routeObservability } from "@/core/router/routes";
import { k8sNameSearchParam } from "@/core/router/searchParams";
import { TIME_RANGES } from "@my-project/shared";
import { createRoute } from "@tanstack/react-router";
import { z } from "zod";

export const PATH_PIPELINE_METRICS = "pipeline-metrics/$namespace" as const;
export const PATH_PIPELINE_METRICS_FULL = "/c/$clusterName/observability/pipeline-metrics/$namespace" as const;
export const ROUTE_ID_PIPELINE_METRICS = "/_layout/c/$clusterName/observability/pipeline-metrics/$namespace" as const;

export const pipelineMetricsSearchSchema = z.object({
  codebase: k8sNameSearchParam,
  timeRange: z.nativeEnum(TIME_RANGES).optional().catch(undefined),
});

export type Search = z.infer<typeof pipelineMetricsSearchSchema>;

export const routePipelineMetrics = createRoute({
  getParentRoute: () => routeObservability,
  path: PATH_PIPELINE_METRICS,
  validateSearch: (search: Record<string, unknown>): Search => pipelineMetricsSearchSchema.parse(search),
  head: ({ params }) => ({
    meta: [{ title: `Pipeline Metrics — ${params.namespace} | KRCI` }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
