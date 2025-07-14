import { routeCluster } from "@/core/router";
import { createRoute } from "@tanstack/react-router";

export const routeRegistryConfiguration = createRoute({
  getParentRoute: () => routeCluster,
  path: "/configuration/registry",
}).lazy(() => import("./route.lazy").then((res) => res.default));
