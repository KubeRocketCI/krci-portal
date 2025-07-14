import { routeCluster } from "@/core/router";
import { createRoute } from "@tanstack/react-router";

export const routeQuicklinksConfiguration = createRoute({
  getParentRoute: () => routeCluster,
  path: "/configuration/quicklinks",
}).lazy(() => import("./route.lazy").then((res) => res.default));
