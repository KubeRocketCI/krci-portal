import { routeCluster } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_COMPONENTS = "components" as const;
export const PATH_COMPONENTS_FULL = "/c/$clusterName/components" as const;
export const ROUTE_ID_COMPONENTS = "/_layout/c/$clusterName/components" as const;

export const routeComponentList = createRoute({
  getParentRoute: () => routeCluster,
  path: PATH_COMPONENTS,
  head: () => ({
    meta: [{ title: "Components | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
