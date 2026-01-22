import { routeCICD } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";
import { z } from "zod";

export const PATH_PIPELINES = "pipelines" as const;
export const PATH_PIPELINES_FULL = "/c/$clusterName/cicd/pipelines" as const;
export const ROUTE_ID_PIPELINES = "/_layout/c/$clusterName/cicd/pipelines" as const;

export interface Search {
  page?: number;
  rowsPerPage?: number;
}

export const routePipelineList = createRoute({
  getParentRoute: () => routeCICD,
  path: PATH_PIPELINES,
  validateSearch: (search: Record<string, unknown>): Search => {
    return z
      .object({
        page: z.number().optional(),
        rowsPerPage: z.number().optional(),
      })
      .parse(search);
  },
  head: () => ({
    meta: [{ title: "Pipelines | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
