import { routeCluster } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";
import { z } from "zod";

export const PATH_COMPONENTS = "components" as const;
export const PATH_COMPONENTS_FULL = "/c/$clusterName/components" as const;
export const ROUTE_ID_COMPONENTS = "/_layout/c/$clusterName/components" as const;

export interface Search {
  page?: number;
  rowsPerPage?: number;
}

export const routeComponentList = createRoute({
  getParentRoute: () => routeCluster,
  path: PATH_COMPONENTS,
  validateSearch: (search: Record<string, unknown>): Search => {
    return z
      .object({
        page: z.number().optional(),
        rowsPerPage: z.number().optional(),
      })
      .parse(search);
  },
  head: () => ({
    meta: [{ title: "Components | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
