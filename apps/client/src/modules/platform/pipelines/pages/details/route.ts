import { routeCICD } from "@/core/router";
import { createRoute } from "@tanstack/react-router";
import { z } from "zod";

export const routeSearchTabSchema = z.enum(["overview", "yaml", "pipelineRunList", "history", "diagram"]);
export const routeSearchTabName = routeSearchTabSchema.enum;

export type RouteSearchTab = z.infer<typeof routeSearchTabSchema>;

export interface Search {
  tab?: RouteSearchTab;
}

export const routePipelineDetails = createRoute({
  getParentRoute: () => routeCICD,
  path: "/pipelines/$namespace/$name",
  validateSearch: (search: Record<string, unknown>): Search => {
    const parsed = z
      .object({
        tab: routeSearchTabSchema.optional(),
      })
      .parse(search);

    return {
      tab: parsed.tab ?? "overview",
    };
  },
}).lazy(() => import("./route.lazy").then((res) => res.default));
