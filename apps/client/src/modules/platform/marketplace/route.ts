import { routeCluster } from "@/core/router";
import { createRoute } from "@tanstack/react-router";

export const routeMarketplace = createRoute({
  getParentRoute: () => routeCluster,
  path: "/marketplace",
}).lazy(() => import("./route.lazy").then((res) => res.default));
