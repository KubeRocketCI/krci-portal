import { routeCICD } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_TRIGGER_BINDINGS = "webhook-triggers/trigger-bindings" as const;
export const PATH_TRIGGER_BINDINGS_FULL = "/c/$clusterName/cicd/webhook-triggers/trigger-bindings" as const;
export const ROUTE_ID_TRIGGER_BINDINGS = "/_layout/c/$clusterName/cicd/webhook-triggers/trigger-bindings" as const;

export type Search = Record<string, unknown>;

export const routeTriggerBindingList = createRoute({
  getParentRoute: () => routeCICD,
  path: PATH_TRIGGER_BINDINGS,
  validateSearch: (search: Record<string, unknown>): Search => search,
  head: () => ({ meta: [{ title: "Trigger Bindings | KRCI" }] }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
