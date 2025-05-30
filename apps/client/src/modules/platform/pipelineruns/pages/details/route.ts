import { routeCluster } from "@/core/router";
import { createRoute } from "@tanstack/react-router";

export const routePipelineRunDetails = createRoute({
  getParentRoute: () => routeCluster,
  path: "/pipelineruns/$namespace/$name",
}).lazy(() => import("./route.lazy").then((res) => res.default));
