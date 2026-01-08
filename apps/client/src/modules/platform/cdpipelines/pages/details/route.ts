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
}

export const routeCDPipelineDetails = createRoute({
  getParentRoute: () => routeCluster,
  path: PATH_CDPIPELINE_DETAILS,
  validateSearch: (search: Record<string, unknown>): Search => {
    const parsed = z
      .object({
        tab: routeSearchTabSchema.optional(),
      })
      .parse(search);

    return {
      tab: parsed.tab ?? "environments",
    };
  },
  head: ({ params }) => ({
    meta: [{ title: `${params.name} [${params.namespace}] — Deployment Flows | KRCI` }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
