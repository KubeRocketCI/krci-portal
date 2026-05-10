import { createRoute } from "@tanstack/react-router";
import { z } from "zod";
import { routeK8sMode } from "@/core/router/routes";

export const PATH_K8S_EVENTS = "events" as const;
export const PATH_K8S_EVENTS_FULL = "/c/$clusterName/k8s/events" as const;
export const ROUTE_ID_K8S_EVENTS = "/_layout/c/$clusterName/k8s/events" as const;

const search = z.object({
  namespace: z.string().optional(),
  type: z.string().optional(),
});

export const routeK8sEvents = createRoute({
  getParentRoute: () => routeK8sMode,
  path: PATH_K8S_EVENTS,
  validateSearch: (s: Record<string, unknown>) => search.parse(s),
  head: () => ({ meta: [{ title: "Events | KRCI" }] }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
