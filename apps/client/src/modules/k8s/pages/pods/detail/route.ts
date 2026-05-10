import { createRoute } from "@tanstack/react-router";
import { routeK8sMode } from "@/core/router/routes";
import { podDetailTabSchema } from "../../../constants/tabs";

export const PATH_K8S_POD_DETAIL = "pods/$namespace/$name" as const;
export const PATH_K8S_POD_DETAIL_FULL = "/c/$clusterName/k8s/pods/$namespace/$name" as const;
export const ROUTE_ID_K8S_POD_DETAIL = "/_layout/c/$clusterName/k8s/pods/$namespace/$name" as const;

export const routeK8sPodDetail = createRoute({
  getParentRoute: () => routeK8sMode,
  path: PATH_K8S_POD_DETAIL,
  validateSearch: (s: Record<string, unknown>) => podDetailTabSchema.parse(s),
  head: () => ({ meta: [{ title: "Pod | KRCI" }] }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
