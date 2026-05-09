import { routeCICD } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_CLUSTER_INTERCEPTORS = "webhook-triggers/cluster-interceptors" as const;
export const PATH_CLUSTER_INTERCEPTORS_FULL = "/c/$clusterName/cicd/webhook-triggers/cluster-interceptors" as const;
export const ROUTE_ID_CLUSTER_INTERCEPTORS =
  "/_layout/c/$clusterName/cicd/webhook-triggers/cluster-interceptors" as const;

export type Search = Record<string, unknown>;

export const routeClusterInterceptorList = createRoute({
  getParentRoute: () => routeCICD,
  path: PATH_CLUSTER_INTERCEPTORS,
  validateSearch: (search: Record<string, unknown>): Search => search,
  head: () => ({ meta: [{ title: "Cluster Interceptors | KRCI" }] }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
