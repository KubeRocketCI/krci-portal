import { createRoute } from "@tanstack/react-router";
import { z } from "zod";
import { routeK8sMode } from "@/core/router/routes";
import { PATH_K8S_NODES_FULL } from "@/modules/k8s/constants/paths";

export const PATH_K8S_NODES = "nodes" as const;
export { PATH_K8S_NODES_FULL };
export const ROUTE_ID_K8S_NODES = "/_layout/c/$clusterName/k8s/nodes" as const;

const search = z.object({});

export const routeK8sNodesList = createRoute({
  getParentRoute: () => routeK8sMode,
  path: PATH_K8S_NODES,
  validateSearch: (s: Record<string, unknown>) => search.parse(s),
  head: () => ({ meta: [{ title: "Nodes | KRCI" }] }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
