import { routeCluster } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";
import z from "zod";

export const PATH_CDPIPELINE_DETAILS = "cdpipelines/$namespace/$name" as const;
export const PATH_CDPIPELINE_DETAILS_FULL = "/c/$clusterName/cdpipelines/$namespace/$name" as const;
export const ROUTE_ID_CDPIPELINE_DETAILS = "/_layout/c/$clusterName/cdpipelines/$namespace/$name" as const;

export const routeSearchTabSchema = z.enum(["applications", "environments"]);
export const routeSearchTabName = routeSearchTabSchema.enum;

export type RouteSearchTab = z.infer<typeof routeSearchTabSchema>;

export interface Search {
  tab?: RouteSearchTab;
  page?: number;
  rowsPerPage?: number;
}

export const routeCDPipelineDetails = createRoute({
  getParentRoute: () => routeCluster,
  path: PATH_CDPIPELINE_DETAILS,
  validateSearch: (search: Record<string, unknown>): Search => {
    return z
      .object({
        tab: routeSearchTabSchema.optional(),
        page: z.number().optional(),
        rowsPerPage: z.number().optional(),
      })
      .parse(search);
  },
  head: ({ params }) => ({
    meta: [{ title: `${params.name} [${params.namespace}] — Deployments | KRCI` }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
