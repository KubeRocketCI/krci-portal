import { routeConfiguration } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_CONFIG_DEPENDENCY_TRACK = "dependency-track" as const;
export const PATH_CONFIG_DEPENDENCY_TRACK_FULL = "/c/$clusterName/configuration/dependency-track" as const;
export const ROUTE_ID_CONFIG_DEPENDENCY_TRACK = "/_layout/c/$clusterName/configuration/dependency-track" as const;

export const routeDependencyTrackConfiguration = createRoute({
  getParentRoute: () => routeConfiguration,
  path: PATH_CONFIG_DEPENDENCY_TRACK,
  head: () => ({
    meta: [{ title: "Dependency Track Configuration | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
