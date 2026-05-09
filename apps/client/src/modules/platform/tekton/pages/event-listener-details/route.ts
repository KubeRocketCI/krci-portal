import { routeCICD } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_EVENT_LISTENER_DETAILS = "webhook-triggers/event-listeners/$namespace/$name" as const;
export const PATH_EVENT_LISTENER_DETAILS_FULL =
  "/c/$clusterName/cicd/webhook-triggers/event-listeners/$namespace/$name" as const;
export const ROUTE_ID_EVENT_LISTENER_DETAILS =
  "/_layout/c/$clusterName/cicd/webhook-triggers/event-listeners/$namespace/$name" as const;

export type Search = Record<string, unknown>;

export const routeEventListenerDetails = createRoute({
  getParentRoute: () => routeCICD,
  path: PATH_EVENT_LISTENER_DETAILS,
  validateSearch: (search: Record<string, unknown>): Search => search,
  head: ({ params }) => ({ meta: [{ title: `${params.name} [${params.namespace}] — Event Listeners | KRCI` }] }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
