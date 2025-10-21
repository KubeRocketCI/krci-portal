import { routeCluster } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_CDPIPELINES = "cdpipelines" as const;
export const PATH_CDPIPELINES_FULL = "/c/$clusterName/cdpipelines" as const;

export const routeCDPipelineList = createRoute({
  getParentRoute: () => routeCluster,
  path: PATH_CDPIPELINES,
  head: () => ({
    meta: [{ title: "Deployment Flows | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
