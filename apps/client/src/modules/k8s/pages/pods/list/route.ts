import { createRoute } from "@tanstack/react-router";
import { z } from "zod";
import { routeK8sMode } from "@/core/router/routes";
import { PATH_K8S_PODS_FULL } from "@/modules/k8s/constants/paths";

export const PATH_K8S_PODS = "pods" as const;
export { PATH_K8S_PODS_FULL };
export const ROUTE_ID_K8S_PODS = "/_layout/c/$clusterName/k8s/pods" as const;

const search = z.object({
  namespace: z.string().optional(),
  namespaces: z.array(z.string()).optional(),
});

export const routeK8sPodsList = createRoute({
  getParentRoute: () => routeK8sMode,
  path: PATH_K8S_PODS,
  validateSearch: (s: Record<string, unknown>) => search.parse(s),
  head: () => ({
    meta: [{ title: "Pods | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
