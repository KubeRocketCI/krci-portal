import { routeCluster } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_PROJECT_CREATE = "projects/create" as const;
export const PATH_PROJECT_CREATE_FULL = "/c/$clusterName/projects/create" as const;
export const ROUTE_ID_PROJECT_CREATE = "/_layout/c/$clusterName/projects/create" as const;

export const routeProjectCreate = createRoute({
  getParentRoute: () => routeCluster,
  path: PATH_PROJECT_CREATE,
  head: () => ({
    meta: [{ title: "Create Project | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
