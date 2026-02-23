import { routeCluster } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";
import z from "zod";

export const PATH_PROJECT_DETAILS = "projects/$namespace/$name" as const;
export const PATH_PROJECT_DETAILS_FULL = "/c/$clusterName/projects/$namespace/$name" as const;
export const ROUTE_ID_PROJECT_DETAILS = "/_layout/c/$clusterName/projects/$namespace/$name" as const;

export const routeSearchTabSchema = z.enum(["overview", "branches", "pipelines", "code", "deployments"]);
export const routeSearchTabName = routeSearchTabSchema.enum;

export const pipelinesTabSchema = z.enum(["live", "tekton-results"]);

export type RouteSearchTab = z.infer<typeof routeSearchTabSchema>;
export type PipelinesTab = z.infer<typeof pipelinesTabSchema>;

export interface Search {
  tab?: RouteSearchTab;
  pipelinesTab?: PipelinesTab;
  page?: number;
  rowsPerPage?: number;
}

export const routeProjectDetails = createRoute({
  getParentRoute: () => routeCluster,
  path: PATH_PROJECT_DETAILS,
  validateSearch: (search: Record<string, unknown>): Search => {
    return z
      .object({
        tab: routeSearchTabSchema.optional(),
        pipelinesTab: pipelinesTabSchema.optional(),
        page: z.number().optional(),
        rowsPerPage: z.number().optional(),
      })
      .parse(search);
  },
  head: ({ params }) => ({
    meta: [{ title: `${params.name} [${params.namespace}] — Projects | KRCI` }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
