import { routeCICD } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_TRIGGERS = "webhook-triggers/triggers" as const;
export const PATH_TRIGGERS_FULL = "/c/$clusterName/cicd/webhook-triggers/triggers" as const;
export const ROUTE_ID_TRIGGERS = "/_layout/c/$clusterName/cicd/webhook-triggers/triggers" as const;

export type Search = Record<string, unknown>;

export const routeTriggerList = createRoute({
  getParentRoute: () => routeCICD,
  path: PATH_TRIGGERS,
  validateSearch: (search: Record<string, unknown>): Search => search,
  head: () => ({ meta: [{ title: "Triggers | KRCI" }] }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
