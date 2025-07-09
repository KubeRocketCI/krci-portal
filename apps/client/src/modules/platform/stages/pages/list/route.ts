import { routeCluster } from "@/core/router";
import { createRoute } from "@tanstack/react-router";

export const routePipelineList = createRoute({
  getParentRoute: () => routeCluster,
  path: "/pipelines",
}).lazy(() => import("./route.lazy").then((res) => res.default));
