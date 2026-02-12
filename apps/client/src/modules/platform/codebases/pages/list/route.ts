import { routeCluster } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";
import { z } from "zod";

export const PATH_PROJECTS = "projects" as const;
export const PATH_PROJECTS_FULL = "/c/$clusterName/projects" as const;
export const ROUTE_ID_PROJECTS = "/_layout/c/$clusterName/projects" as const;

export interface Search {
  page?: number;
  rowsPerPage?: number;
}

export const routeProjectList = createRoute({
  getParentRoute: () => routeCluster,
  path: PATH_PROJECTS,
  validateSearch: (search: Record<string, unknown>): Search => {
    return z
      .object({
        page: z.number().optional(),
        rowsPerPage: z.number().optional(),
      })
      .parse(search);
  },
  head: () => ({
    meta: [{ title: "Projects | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
