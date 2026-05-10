import { createRoute } from "@tanstack/react-router";
import { routeK8sMode } from "@/core/router/routes";
import { nodeDetailTabSchema } from "../../../constants/tabs";

export const PATH_K8S_NODE_DETAIL = "nodes/$name" as const;
export const PATH_K8S_NODE_DETAIL_FULL = "/c/$clusterName/k8s/nodes/$name" as const;
export const ROUTE_ID_K8S_NODE_DETAIL = "/_layout/c/$clusterName/k8s/nodes/$name" as const;

export const routeK8sNodeDetail = createRoute({
  getParentRoute: () => routeK8sMode,
  path: PATH_K8S_NODE_DETAIL,
  validateSearch: (s: Record<string, unknown>) => nodeDetailTabSchema.parse(s),
  head: () => ({ meta: [{ title: "Node | KRCI" }] }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
