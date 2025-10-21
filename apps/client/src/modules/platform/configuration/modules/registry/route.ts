import { routeConfiguration } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_CONFIG_REGISTRY = "registry" as const;
export const PATH_CONFIG_REGISTRY_FULL = "/c/$clusterName/configuration/registry" as const;

export const routeRegistryConfiguration = createRoute({
  getParentRoute: () => routeConfiguration,
  path: PATH_CONFIG_REGISTRY,
  head: () => ({
    meta: [{ title: "Registry Configuration | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
