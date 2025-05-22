import { routeCluster } from "@/core/router";
import { createRoute } from "@tanstack/react-router";

export const routeComponentDetails = createRoute({
  getParentRoute: () => routeCluster,
  path: "/components/$namespace/$name",
}).lazy(() => import("./route.lazy").then((res) => res.default));
