import { routeSecurity } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";
import { z } from "zod";

export const PATH_SAST = "sast/projects/$namespace" as const;
export const PATH_SAST_FULL = "/c/$clusterName/security/sast/projects/$namespace" as const;
export const ROUTE_ID_SAST = "/_layout/c/$clusterName/security/sast/projects/$namespace" as const;

export interface Search {
  page?: number;
  rowsPerPage?: number;
}

export const routeSAST = createRoute({
  getParentRoute: () => routeSecurity,
  path: PATH_SAST,
  validateSearch: (search: Record<string, unknown>): Search => {
    return z
      .object({
        page: z.number().int().positive().optional(),
        rowsPerPage: z.number().int().positive().optional(),
      })
      .parse(search);
  },
  head: ({ params }) => ({
    meta: [{ title: `SAST — ${params.namespace} | KRCI` }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
