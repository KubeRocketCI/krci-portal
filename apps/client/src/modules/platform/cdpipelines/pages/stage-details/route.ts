import { routeCluster } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";
import { z } from "zod";

export const PATH_CDPIPELINE_STAGE_DETAILS = "cdpipelines/$namespace/$cdPipeline/stages/$stage" as const;
export const PATH_CDPIPELINE_STAGE_DETAILS_FULL =
  "/c/$clusterName/cdpipelines/$namespace/$cdPipeline/stages/$stage" as const;
export const ROUTE_ID_CDPIPELINE_STAGE_DETAILS =
  "/_layout/c/$clusterName/cdpipelines/$namespace/$cdPipeline/stages/$stage" as const;

export const routeSearchTabSchema = z.enum(["overview", "applications", "pipelines", "variables", "monitoring"]);
export const routeSearchTabName = routeSearchTabSchema.enum;

export type RouteSearchTab = z.infer<typeof routeSearchTabSchema>;

export const applicationsModeSchema = z.enum(["preview", "configure"]);
export const applicationsModeName = applicationsModeSchema.enum;

export type ApplicationsMode = z.infer<typeof applicationsModeSchema>;

export interface Search {
  tab?: RouteSearchTab;
  applicationsMode?: ApplicationsMode;
  page?: number;
  rowsPerPage?: number;
}

export const routeStageDetails = createRoute({
  getParentRoute: () => routeCluster,
  path: PATH_CDPIPELINE_STAGE_DETAILS,
  validateSearch: (search: Record<string, unknown>): Search => {
    const parsed = z
      .object({
        tab: routeSearchTabSchema.optional(),
        applicationsMode: applicationsModeSchema.optional(),
        page: z.number().optional(),
        rowsPerPage: z.number().optional(),
      })
      .parse(search);

    return {
      ...parsed,
      tab: parsed.tab ?? routeSearchTabName.overview,
    };
  },
  head: ({ params }) => ({
    meta: [{ title: `${params.cdPipeline} [${params.namespace}] — ${params.stage} Stage | KRCI` }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
