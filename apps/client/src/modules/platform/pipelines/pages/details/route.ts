import { routeCICD } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";
import { z } from "zod";

export const PATH_PIPELINE_DETAILS = "pipelines/$namespace/$name" as const;
export const PATH_PIPELINE_DETAILS_FULL = "/c/$clusterName/cicd/pipelines/$namespace/$name" as const;

export const routeSearchTabSchema = z.enum(["overview", "yaml", "pipelineRunList", "history", "diagram"]);
export const routeSearchTabName = routeSearchTabSchema.enum;

export type RouteSearchTab = z.infer<typeof routeSearchTabSchema>;

export interface Search {
  tab?: RouteSearchTab;
}

export const routePipelineDetails = createRoute({
  getParentRoute: () => routeCICD,
  path: PATH_PIPELINE_DETAILS,
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
    meta: [{ title: `${params.name} [${params.namespace}] — Pipelines | KRCI` }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
