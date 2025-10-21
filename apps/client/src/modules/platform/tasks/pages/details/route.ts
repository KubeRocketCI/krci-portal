import { routeCICD } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";
import { z } from "zod";

export const PATH_TASK_DETAILS = "tasks/$namespace/$name" as const;
export const PATH_TASK_DETAILS_FULL = "/c/$clusterName/cicd/tasks/$namespace/$name" as const;

export const routeSearchTabSchema = z.enum(["overview", "yaml"]);
export const routeSearchTabName = routeSearchTabSchema.enum;

export type RouteSearchTab = z.infer<typeof routeSearchTabSchema>;

export interface Search {
  tab?: RouteSearchTab;
}

export const routeTaskDetails = createRoute({
  getParentRoute: () => routeCICD,
  path: PATH_TASK_DETAILS,
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
  head: ({ params }) => ({
    meta: [{ title: `${params.name} [${params.namespace}] — Tasks | KRCI` }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
