import { routeCluster } from "@/core/router";
import { createRoute } from "@tanstack/react-router";

export const routePipelineDetails = createRoute({
  getParentRoute: () => routeCluster,
  path: "/pipelines/$namespace/$name",
}).lazy(() => import("./route.lazy").then((res) => res.default));
