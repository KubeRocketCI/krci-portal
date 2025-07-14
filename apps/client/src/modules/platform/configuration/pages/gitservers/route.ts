import { routeCluster } from "@/core/router";
import { createRoute } from "@tanstack/react-router";

export const routeGitserversConfiguration = createRoute({
  getParentRoute: () => routeCluster,
  path: "/configuration/gitservers",
}).lazy(() => import("./route.lazy").then((res) => res.default));
