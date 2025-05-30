import { routeCluster } from "@/core/router";
import { createRoute } from "@tanstack/react-router";

export const routeCDPipelineList = createRoute({
  getParentRoute: () => routeCluster,
  path: "/cdpipelines",
}).lazy(() => import("./route.lazy").then((res) => res.default));
