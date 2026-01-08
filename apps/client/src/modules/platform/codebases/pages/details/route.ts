import { routeCluster } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_COMPONENT_DETAILS = "components/$namespace/$name" as const;
export const PATH_COMPONENT_DETAILS_FULL = "/c/$clusterName/components/$namespace/$name" as const;
export const ROUTE_ID_COMPONENT_DETAILS = "/_layout/c/$clusterName/components/$namespace/$name" as const;

export const routeComponentDetails = createRoute({
  getParentRoute: () => routeCluster,
  path: PATH_COMPONENT_DETAILS,
  head: ({ params }) => ({
    meta: [{ title: `${params.name} [${params.namespace}] — Components | KRCI` }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
