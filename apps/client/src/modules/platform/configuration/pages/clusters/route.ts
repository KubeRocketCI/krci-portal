import { routeCluster } from "@/core/router";
import { createRoute } from "@tanstack/react-router";

export const routeClustersConfiguration = createRoute({
  getParentRoute: () => routeCluster,
  path: "/configuration/clusters",
}).lazy(() => import("./route.lazy").then((res) => res.default));
