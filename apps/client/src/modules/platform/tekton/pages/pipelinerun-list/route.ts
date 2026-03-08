import { routeCICD } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";
import z from "zod";

export const PATH_PIPELINERUNS = "pipelineruns" as const;
export const PATH_PIPELINERUNS_FULL = "/c/$clusterName/cicd/pipelineruns" as const;
export const ROUTE_ID_PIPELINERUNS = "/_layout/c/$clusterName/cicd/pipelineruns" as const;

export interface Search {
  page?: number;
  rowsPerPage?: number;
}

export const routePipelineRunList = createRoute({
  getParentRoute: () => routeCICD,
  path: PATH_PIPELINERUNS,
  validateSearch: (search: Record<string, unknown>): Search => {
    const parsed = z
      .object({
        page: z.number().optional(),
        rowsPerPage: z.number().optional(),
      })
      .parse(search);

    return parsed;
  },
  head: () => ({
    meta: [{ title: "Pipeline Runs | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((m) => m.Route));
