import { createRoute } from "@tanstack/react-router";
import { routeK8sMode } from "@/core/router/routes";

export const PATH_K8S_OVERVIEW = "overview" as const;
export const PATH_K8S_OVERVIEW_FULL = "/c/$clusterName/k8s/overview" as const;
export const ROUTE_ID_K8S_OVERVIEW = "/_layout/c/$clusterName/k8s/overview" as const;

export const routeK8sOverview = createRoute({
  getParentRoute: () => routeK8sMode,
  path: PATH_K8S_OVERVIEW,
  head: () => ({
    meta: [{ title: "Cluster Overview | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
