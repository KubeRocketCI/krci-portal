import { routeCluster } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_PROJECT_DETAILS = "projects/$namespace/$name" as const;
export const PATH_PROJECT_DETAILS_FULL = "/c/$clusterName/projects/$namespace/$name" as const;
export const ROUTE_ID_PROJECT_DETAILS = "/_layout/c/$clusterName/projects/$namespace/$name" as const;

export const routeProjectDetails = createRoute({
  getParentRoute: () => routeCluster,
  path: PATH_PROJECT_DETAILS,
  head: ({ params }) => ({
    meta: [{ title: `${params.name} [${params.namespace}] — Projects | KRCI` }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
