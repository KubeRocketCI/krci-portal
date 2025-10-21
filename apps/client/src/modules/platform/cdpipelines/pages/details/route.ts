import { routeCluster } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_CDPIPELINE_DETAILS = "cdpipelines/$namespace/$name" as const;
export const PATH_CDPIPELINE_DETAILS_FULL = "/c/$clusterName/cdpipelines/$namespace/$name" as const;

export const routeCDPipelineDetails = createRoute({
  getParentRoute: () => routeCluster,
  path: PATH_CDPIPELINE_DETAILS,
  head: ({ params }) => ({
    meta: [{ title: `${params.name} [${params.namespace}] — Deployment Flows | KRCI` }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
