import { routeCluster } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";
import { z } from "zod";

export const PATH_MARKETPLACE = "marketplace" as const;
export const PATH_MARKETPLACE_FULL = "/c/$clusterName/marketplace" as const;
export const ROUTE_ID_MARKETPLACE = "/_layout/c/$clusterName/marketplace" as const;

export interface Search {
  page?: number;
  rowsPerPage?: number;
}

export const routeMarketplace = createRoute({
  getParentRoute: () => routeCluster,
  path: PATH_MARKETPLACE,
  validateSearch: (search: Record<string, unknown>): Search => {
    return z
      .object({
        page: z.number().optional(),
        rowsPerPage: z.number().optional(),
      })
      .parse(search);
  },
  head: () => ({
    meta: [{ title: "Marketplace | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
