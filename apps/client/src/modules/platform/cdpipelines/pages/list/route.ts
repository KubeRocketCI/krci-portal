import { routeCluster } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";
import { z } from "zod";

export const PATH_CDPIPELINES = "cdpipelines" as const;
export const PATH_CDPIPELINES_FULL = "/c/$clusterName/cdpipelines" as const;
export const ROUTE_ID_CDPIPELINES = "/_layout/c/$clusterName/cdpipelines" as const;

export interface Search {
  page?: number;
  rowsPerPage?: number;
}

export const routeCDPipelineList = createRoute({
  getParentRoute: () => routeCluster,
  path: PATH_CDPIPELINES,
  validateSearch: (search: Record<string, unknown>): Search => {
    return z
      .object({
        page: z.number().optional(),
        rowsPerPage: z.number().optional(),
      })
      .parse(search);
  },
  head: () => ({
    meta: [{ title: "Deployment Flows | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
