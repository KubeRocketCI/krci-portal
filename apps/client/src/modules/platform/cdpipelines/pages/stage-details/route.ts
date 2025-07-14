import { routeCluster } from "@/core/router";
import { createRoute } from "@tanstack/react-router";

export const routeStageDetails = createRoute({
  getParentRoute: () => routeCluster,
  path: "/cdpipelines/$namespace/$cdPipeline/stages/$stage",
}).lazy(() => import("./route.lazy").then((res) => res.default));
