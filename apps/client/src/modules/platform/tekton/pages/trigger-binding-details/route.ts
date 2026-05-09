import { routeCICD } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";
import { z } from "zod";

export const PATH_TRIGGER_BINDING_DETAILS = "webhook-triggers/trigger-bindings/$namespace/$name" as const;
export const PATH_TRIGGER_BINDING_DETAILS_FULL =
  "/c/$clusterName/cicd/webhook-triggers/trigger-bindings/$namespace/$name" as const;
export const ROUTE_ID_TRIGGER_BINDING_DETAILS =
  "/_layout/c/$clusterName/cicd/webhook-triggers/trigger-bindings/$namespace/$name" as const;

export const routeSearchTabSchema = z.enum(["overview", "yaml"]);
export const routeSearchTabName = routeSearchTabSchema.enum;
export type RouteSearchTab = z.infer<typeof routeSearchTabSchema>;

export interface Search {
  tab?: RouteSearchTab;
}

export const routeTriggerBindingDetails = createRoute({
  getParentRoute: () => routeCICD,
  path: PATH_TRIGGER_BINDING_DETAILS,
  validateSearch: (search: Record<string, unknown>): Search => {
    const parsed = z.object({ tab: routeSearchTabSchema.optional() }).parse(search);
    return { tab: parsed.tab ?? "overview" };
  },
  head: ({ params }) => ({ meta: [{ title: `${params.name} [${params.namespace}] — Trigger Bindings | KRCI` }] }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
