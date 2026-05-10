import { createRoute } from "@tanstack/react-router";
import { routeK8sMode } from "@/core/router/routes";
import { baseDetailTabSchema } from "../../constants/tabs";
import { PATH_K8S_DETAIL_NS_FULL } from "@/modules/k8s/constants/paths";

export const PATH_K8S_DETAIL_NS = "ns/$kind/$namespace/$name" as const;
export { PATH_K8S_DETAIL_NS_FULL };
export const ROUTE_ID_K8S_DETAIL_NS = "/_layout/c/$clusterName/k8s/ns/$kind/$namespace/$name" as const;

export const routeK8sDetailNamespaced = createRoute({
  getParentRoute: () => routeK8sMode,
  path: PATH_K8S_DETAIL_NS,
  validateSearch: (search: Record<string, unknown>) => baseDetailTabSchema.parse(search),
  head: () => ({
    meta: [{ title: "Resource | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
