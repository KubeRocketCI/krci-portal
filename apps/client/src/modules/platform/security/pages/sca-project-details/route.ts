import { routeSecurity } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";
import { z } from "zod";

export const PATH_SCA_PROJECT_DETAILS = "sca/projects/$namespace/$projectUuid" as const;
export const PATH_SCA_PROJECT_DETAILS_FULL = "/c/$clusterName/security/sca/projects/$namespace/$projectUuid" as const;
export const ROUTE_ID_SCA_PROJECT_DETAILS =
  "/_layout/c/$clusterName/security/sca/projects/$namespace/$projectUuid" as const;

export interface Search {
  page?: number;
  rowsPerPage?: number;
}

export const routeSCAProjectDetails = createRoute({
  getParentRoute: () => routeSecurity,
  path: PATH_SCA_PROJECT_DETAILS,
  validateSearch: (search: Record<string, unknown>): Search => {
    return z
      .object({
        page: z.number().optional(),
        rowsPerPage: z.number().optional(),
      })
      .parse(search);
  },
  head: ({ params }) => ({
    meta: [{ title: `Project Details — ${params.namespace} | KRCI` }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
