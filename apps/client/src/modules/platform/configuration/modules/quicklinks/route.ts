import { routeConfiguration } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";
import { z } from "zod";

export const PATH_CONFIG_QUICKLINKS = "quicklinks" as const;
export const PATH_CONFIG_QUICKLINKS_FULL = "/c/$clusterName/configuration/quicklinks" as const;
export const ROUTE_ID_CONFIG_QUICKLINKS = "/_layout/c/$clusterName/configuration/quicklinks" as const;

export interface Search {
  page?: number;
  rowsPerPage?: number;
}

export const routeQuicklinksConfiguration = createRoute({
  getParentRoute: () => routeConfiguration,
  path: PATH_CONFIG_QUICKLINKS,
  validateSearch: (search: Record<string, unknown>): Search => {
    return z
      .object({
        page: z.number().optional(),
        rowsPerPage: z.number().optional(),
      })
      .parse(search);
  },
  head: () => ({
    meta: [{ title: "Quick Links Configuration | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
