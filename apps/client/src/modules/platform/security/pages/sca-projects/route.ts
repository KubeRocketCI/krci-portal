import { routeSecurity } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";
import { z } from "zod";

export const PATH_SCA_PROJECTS = "sca/projects/$namespace" as const;
export const PATH_SCA_PROJECTS_FULL = "/c/$clusterName/security/sca/projects/$namespace" as const;
export const ROUTE_ID_SCA_PROJECTS = "/_layout/c/$clusterName/security/sca/projects/$namespace" as const;

export interface Search {
  page?: number;
  rowsPerPage?: number;
}

export const routeSCAProjects = createRoute({
  getParentRoute: () => routeSecurity,
  path: PATH_SCA_PROJECTS,
  validateSearch: (search: Record<string, unknown>): Search => {
    return z
      .object({
        page: z.number().optional(),
        rowsPerPage: z.number().optional(),
      })
      .parse(search);
  },
  head: ({ params }) => ({
    meta: [{ title: `SCA Projects — ${params.namespace} | KRCI` }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
