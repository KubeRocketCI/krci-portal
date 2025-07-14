import { routeCluster } from "@/core/router";
import { createRoute } from "@tanstack/react-router";

export const routeDependencyTrackConfiguration = createRoute({
  getParentRoute: () => routeCluster,
  path: "/configuration/dependency-track",
}).lazy(() => import("./route.lazy").then((res) => res.default));
