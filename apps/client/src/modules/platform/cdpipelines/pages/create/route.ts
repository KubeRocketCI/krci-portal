import { routeCluster } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_CDPIPELINE_CREATE = "cdpipelines/create" as const;
export const PATH_CDPIPELINE_CREATE_FULL = "/c/$clusterName/cdpipelines/create" as const;
export const ROUTE_ID_CDPIPELINE_CREATE = "/_layout/c/$clusterName/cdpipelines/create" as const;

export interface SearchParams {
  application?: string;
}

export const routeCDPipelineCreate = createRoute({
  getParentRoute: () => routeCluster,
  path: PATH_CDPIPELINE_CREATE,
  validateSearch: (search: SearchParams): SearchParams => {
    return {
      application: (search.application as string) || undefined,
    };
  },
  head: () => ({
    meta: [{ title: "Create Deployment Flow | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
