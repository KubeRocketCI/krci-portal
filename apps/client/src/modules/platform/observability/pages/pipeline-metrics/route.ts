import { routeObservability } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_PIPELINE_METRICS = "pipeline-metrics/$namespace" as const;
export const PATH_PIPELINE_METRICS_FULL = "/c/$clusterName/observability/pipeline-metrics/$namespace" as const;
export const ROUTE_ID_PIPELINE_METRICS = "/_layout/c/$clusterName/observability/pipeline-metrics/$namespace" as const;

export const routePipelineMetrics = createRoute({
  getParentRoute: () => routeObservability,
  path: PATH_PIPELINE_METRICS,
  head: ({ params }) => ({
    meta: [{ title: `Pipeline Metrics — ${params.namespace} | KRCI` }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
