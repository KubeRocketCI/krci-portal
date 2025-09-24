import { routeCluster } from "@/core/router";
import { createRoute } from "@tanstack/react-router";

export const routeArgocdConfiguration = createRoute({
  getParentRoute: () => routeCluster,
  path: "/configuration/argocd",
}).lazy(() => import("./route.lazy").then((res) => res.default));
