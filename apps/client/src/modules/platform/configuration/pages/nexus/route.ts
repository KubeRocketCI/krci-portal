import { routeCluster } from "@/core/router";
import { createRoute } from "@tanstack/react-router";

export const routeNexusConfiguration = createRoute({
  getParentRoute: () => routeCluster,
  path: "/configuration/nexus",
}).lazy(() => import("./route.lazy").then((res) => res.default));
