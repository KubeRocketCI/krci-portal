import { createRoute } from "@tanstack/react-router";
import { z } from "zod";
import { routeK8sMode } from "@/core/router/routes";

export const PATH_K8S_LIST = "$kind" as const;
export const PATH_K8S_LIST_FULL = "/c/$clusterName/k8s/$kind" as const;
export const ROUTE_ID_K8S_LIST = "/_layout/c/$clusterName/k8s/$kind" as const;

const searchSchema = z.object({
  namespace: z.string().optional(),
  namespaces: z.array(z.string()).optional(),
  tab: z.string().optional(),
});

export const routeK8sList = createRoute({
  getParentRoute: () => routeK8sMode,
  path: PATH_K8S_LIST,
  validateSearch: (search: Record<string, unknown>) => searchSchema.parse(search),
  head: () => ({
    meta: [{ title: "Kubernetes | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
