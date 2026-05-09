import { routeCICD } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_TRIGGER_TEMPLATES = "webhook-triggers/trigger-templates" as const;
export const PATH_TRIGGER_TEMPLATES_FULL = "/c/$clusterName/cicd/webhook-triggers/trigger-templates" as const;
export const ROUTE_ID_TRIGGER_TEMPLATES = "/_layout/c/$clusterName/cicd/webhook-triggers/trigger-templates" as const;

export type Search = Record<string, unknown>;

export const routeTriggerTemplateList = createRoute({
  getParentRoute: () => routeCICD,
  path: PATH_TRIGGER_TEMPLATES,
  validateSearch: (search: Record<string, unknown>): Search => search,
  head: () => ({ meta: [{ title: "Trigger Templates | KRCI" }] }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
