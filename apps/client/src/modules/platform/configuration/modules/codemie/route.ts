import { routeConfiguration } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_CONFIG_CODEMIE = "codemie" as const;
export const PATH_CONFIG_CODEMIE_FULL = "/c/$clusterName/configuration/codemie" as const;
export const ROUTE_ID_CONFIG_CODEMIE = "/_layout/c/$clusterName/configuration/codemie" as const;

export const routeCodemieConfiguration = createRoute({
  getParentRoute: () => routeConfiguration,
  path: PATH_CONFIG_CODEMIE,
  head: () => ({
    meta: [{ title: "Codemie Configuration | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
