import { routeCluster } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_CODEBASE_CREATE = "components/create" as const;
export const PATH_CODEBASE_CREATE_FULL = "/c/$clusterName/components/create" as const;
export const ROUTE_ID_CODEBASE_CREATE = "/_layout/c/$clusterName/components/create" as const;

export const routeCodebaseCreate = createRoute({
  getParentRoute: () => routeCluster,
  path: PATH_CODEBASE_CREATE,
  head: () => ({
    meta: [{ title: "Create Project | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
