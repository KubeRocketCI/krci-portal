import { routeCICD } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";
import { z } from "zod";

export const PATH_TASKS = "tasks" as const;
export const PATH_TASKS_FULL = "/c/$clusterName/cicd/tasks" as const;
export const ROUTE_ID_TASKS = "/_layout/c/$clusterName/cicd/tasks" as const;

export interface Search {
  page?: number;
  rowsPerPage?: number;
}

export const routeTaskList = createRoute({
  getParentRoute: () => routeCICD,
  path: PATH_TASKS,
  validateSearch: (search: Record<string, unknown>): Search => {
    return z
      .object({
        page: z.number().optional(),
        rowsPerPage: z.number().optional(),
      })
      .parse(search);
  },
  head: () => ({
    meta: [{ title: "Tasks | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
