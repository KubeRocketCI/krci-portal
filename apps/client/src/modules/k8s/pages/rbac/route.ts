import { createRoute } from "@tanstack/react-router";
import { routeK8sMode } from "@/core/router/routes";
import { rbacOverviewTabSchema } from "../../constants/tabs";

export const PATH_K8S_RBAC = "rbac" as const;
export const PATH_K8S_RBAC_FULL = "/c/$clusterName/k8s/rbac" as const;
export const ROUTE_ID_K8S_RBAC = "/_layout/c/$clusterName/k8s/rbac" as const;

export const routeK8sRbacOverview = createRoute({
  getParentRoute: () => routeK8sMode,
  path: PATH_K8S_RBAC,
  validateSearch: (s: Record<string, unknown>) => rbacOverviewTabSchema.parse(s),
  head: () => ({ meta: [{ title: "RBAC | KRCI" }] }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
