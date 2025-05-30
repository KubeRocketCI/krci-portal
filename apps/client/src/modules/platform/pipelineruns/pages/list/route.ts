import { routeCluster } from "@/core/router";
import { createRoute } from "@tanstack/react-router";

export const routePipelineRunList = createRoute({
  getParentRoute: () => routeCluster,
  path: "/pipelineruns",
}).lazy(() => import("./route.lazy").then((res) => res.default));
