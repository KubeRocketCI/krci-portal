import { routeSecurity } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";
import { z } from "zod";

export const PATH_SCA_PROJECT_DETAILS = "sca/projects/$namespace/$projectUuid" as const;
export const PATH_SCA_PROJECT_DETAILS_FULL = "/c/$clusterName/security/sca/projects/$namespace/$projectUuid" as const;
export const ROUTE_ID_SCA_PROJECT_DETAILS =
  "/_layout/c/$clusterName/security/sca/projects/$namespace/$projectUuid" as const;

export const routeSearchTabSchema = z.enum([
  "overview",
  "components",
  "services",
  "dependencies",
  "vulnerabilities",
  "epss",
  "violations",
]);
export const routeSearchTabName = routeSearchTabSchema.enum;

export type RouteSearchTab = z.infer<typeof routeSearchTabSchema>;

export interface Search {
  tab?: RouteSearchTab;
  page?: number;
  rowsPerPage?: number;
}

export const routeSCAProjectDetails = createRoute({
  getParentRoute: () => routeSecurity,
  path: PATH_SCA_PROJECT_DETAILS,
  validateSearch: (search: Record<string, unknown>): Search => {
    const parsed = z
      .object({
        tab: routeSearchTabSchema.optional(),
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
    meta: [{ title: `Project Details — ${params.namespace} | KRCI` }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
