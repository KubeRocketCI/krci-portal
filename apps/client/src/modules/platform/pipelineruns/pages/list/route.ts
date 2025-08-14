import { routeCICD } from "@/core/router";
import { createRoute } from "@tanstack/react-router";
import z from "zod";

export const routeSearchTabSchema = z.enum(["live", "history"]);
export const routeSearchTabName = routeSearchTabSchema.enum;

export type RouteSearchTab = z.infer<typeof routeSearchTabSchema>;

export interface Search {
  tab?: RouteSearchTab;
}

export const routePipelineRunList = createRoute({
  getParentRoute: () => routeCICD,
  path: "/pipelineruns",
  validateSearch: (search: Record<string, unknown>): Search => {
    const parsed = z
      .object({
        tab: routeSearchTabSchema.optional(),
      })
      .parse(search);

    return {
      tab: parsed.tab ?? "live",
    };
  },
}).lazy(() => import("./route.lazy").then((m) => m.Route));
