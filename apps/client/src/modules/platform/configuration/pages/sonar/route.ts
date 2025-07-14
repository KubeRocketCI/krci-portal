import { routeCluster } from "@/core/router";
import { createRoute } from "@tanstack/react-router";

export const routeSonarConfiguration = createRoute({
  getParentRoute: () => routeCluster,
  path: "/configuration/sonar",
}).lazy(() => import("./route.lazy").then((res) => res.default));
