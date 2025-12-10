import { routeCluster } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_STAGE_CREATE = "cdpipelines/$namespace/$cdPipeline/stages/create" as const;
export const PATH_STAGE_CREATE_FULL = "/c/$clusterName/cdpipelines/$namespace/$cdPipeline/stages/create" as const;

export const routeStageCreate = createRoute({
  getParentRoute: () => routeCluster,
  path: PATH_STAGE_CREATE,
  head: ({ params }) => ({
    meta: [{ title: `Create Environment — ${params.cdPipeline} [${params.namespace}] | KRCI` }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
