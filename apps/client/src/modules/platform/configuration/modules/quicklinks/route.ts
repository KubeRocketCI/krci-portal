import { routeConfiguration } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_CONFIG_QUICKLINKS = "quicklinks" as const;
export const PATH_CONFIG_QUICKLINKS_FULL = "/c/$clusterName/configuration/quicklinks" as const;
export const ROUTE_ID_CONFIG_QUICKLINKS = "/_layout/c/$clusterName/configuration/quicklinks" as const;

export const routeQuicklinksConfiguration = createRoute({
  getParentRoute: () => routeConfiguration,
  path: PATH_CONFIG_QUICKLINKS,
  head: () => ({
    meta: [{ title: "Quick Links Configuration | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
