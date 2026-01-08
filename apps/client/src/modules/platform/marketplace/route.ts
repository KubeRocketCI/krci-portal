import { routeCluster } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_MARKETPLACE = "marketplace" as const;
export const PATH_MARKETPLACE_FULL = "/c/$clusterName/marketplace" as const;
export const ROUTE_ID_MARKETPLACE = "/_layout/c/$clusterName/marketplace" as const;

export const routeMarketplace = createRoute({
  getParentRoute: () => routeCluster,
  path: PATH_MARKETPLACE,
  head: () => ({
    meta: [{ title: "Marketplace | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
