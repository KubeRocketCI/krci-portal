import { routeCluster } from "@/core/router";
import { createRoute } from "@tanstack/react-router";

export const routeOverviewDetails = createRoute({
  getParentRoute: () => routeCluster,
  path: "/overview/$namespace",
}).lazy(() => import("./route.lazy").then((res) => res.default));
