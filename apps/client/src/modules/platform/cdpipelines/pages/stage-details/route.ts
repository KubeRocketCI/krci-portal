import { routeCluster } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_CDPIPELINE_STAGE_DETAILS = "cdpipelines/$namespace/$cdPipeline/stages/$stage" as const;
export const PATH_CDPIPELINE_STAGE_DETAILS_FULL =
  "/c/$clusterName/cdpipelines/$namespace/$cdPipeline/stages/$stage" as const;

export const routeStageDetails = createRoute({
  getParentRoute: () => routeCluster,
  path: PATH_CDPIPELINE_STAGE_DETAILS,
  head: ({ params }) => ({
    meta: [{ title: `${params.cdPipeline} [${params.namespace}] — ${params.stage} Stage | KRCI` }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
