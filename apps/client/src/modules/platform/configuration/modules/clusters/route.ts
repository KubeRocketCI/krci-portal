import { routeConfiguration } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_CONFIG_CLUSTERS = "clusters" as const;
export const PATH_CONFIG_CLUSTERS_FULL = "/c/$clusterName/configuration/clusters" as const;
export const ROUTE_ID_CONFIG_CLUSTERS = "/_layout/c/$clusterName/configuration/clusters" as const;

export const routeClustersConfiguration = createRoute({
  getParentRoute: () => routeConfiguration,
  path: PATH_CONFIG_CLUSTERS,
  head: () => ({
    meta: [{ title: "Clusters Configuration | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
