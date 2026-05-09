import { routeCICD } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_EVENT_LISTENERS = "webhook-triggers/event-listeners" as const;
export const PATH_EVENT_LISTENERS_FULL = "/c/$clusterName/cicd/webhook-triggers/event-listeners" as const;
export const ROUTE_ID_EVENT_LISTENERS = "/_layout/c/$clusterName/cicd/webhook-triggers/event-listeners" as const;

export type Search = Record<string, unknown>;

export const routeEventListenerList = createRoute({
  getParentRoute: () => routeCICD,
  path: PATH_EVENT_LISTENERS,
  validateSearch: (search: Record<string, unknown>): Search => search,
  head: () => ({ meta: [{ title: "Event Listeners | KRCI" }] }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
