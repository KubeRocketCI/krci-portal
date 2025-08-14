import { routeCICD } from "@/core/router";
import { createRoute } from "@tanstack/react-router";
import { z } from "zod";

export const routeSearchTabSchema = z.enum(["overview", "details", "yaml", "results", "diagram"]);
export const routeSearchTabName = routeSearchTabSchema.enum;

export type RouteSearchTab = z.infer<typeof routeSearchTabSchema>;

export interface Search {
  tab?: RouteSearchTab;
  taskRun?: string;
  step?: string;
}

export const routePipelineRunDetails = createRoute({
  getParentRoute: () => routeCICD,
  path: "pipelineruns/$namespace/$name",
  validateSearch: (search: Record<string, unknown>): Search => {
    const parsed = z
      .object({
        tab: routeSearchTabSchema.optional(),
        taskRun: z.string().optional(),
        step: z.string().optional(),
      })
      .parse(search);

    return {
      tab: parsed.tab ?? "overview",
      taskRun: parsed.taskRun,
      step: parsed.step,
    };
  },
}).lazy(() => import("./route.lazy").then((res) => res.default));
