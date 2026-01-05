import { routeCICD } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";
import { z } from "zod";

export const PATH_PIPELINERUN_DETAILS = "pipelineruns/$namespace/$name" as const;
export const PATH_PIPELINERUN_DETAILS_FULL = "/c/$clusterName/cicd/pipelineruns/$namespace/$name" as const;

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
  path: PATH_PIPELINERUN_DETAILS,
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
  head: ({ params }) => ({
    meta: [{ title: `${params.name} [${params.namespace}] — Pipeline Runs | KRCI` }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
