import { routeConfiguration } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_CONFIG_NEXUS = "nexus" as const;
export const PATH_CONFIG_NEXUS_FULL = "/c/$clusterName/configuration/nexus" as const;
export const ROUTE_ID_CONFIG_NEXUS = "/_layout/c/$clusterName/configuration/nexus" as const;

export const routeNexusConfiguration = createRoute({
  getParentRoute: () => routeConfiguration,
  path: PATH_CONFIG_NEXUS,
  head: () => ({
    meta: [{ title: "Nexus Configuration | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
