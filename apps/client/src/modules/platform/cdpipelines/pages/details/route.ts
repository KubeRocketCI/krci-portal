import { routeCluster } from "@/core/router";
import { createRoute } from "@tanstack/react-router";

export const routeCDPipelineDetails = createRoute({
  getParentRoute: () => routeCluster,
  path: "/cdpipelines/$namespace/$name",
}).lazy(() => import("./route.lazy").then((res) => res.default));
