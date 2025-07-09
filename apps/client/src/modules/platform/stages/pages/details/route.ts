import { routeCluster } from "@/core/router";
import { createRoute } from "@tanstack/react-router";

export const routeStageDetails = createRoute({
  getParentRoute: () => routeCluster,
  path: "/cdpipelines/$namespace/$CDPipelineName/$stageName",
}).lazy(() => import("./route.lazy").then((res) => res.default));
