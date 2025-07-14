import { routeCluster } from "@/core/router";
import { createRoute } from "@tanstack/react-router";

export const routeGitopsConfiguration = createRoute({
  getParentRoute: () => routeCluster,
  path: "/configuration/gitops",
}).lazy(() => import("./route.lazy").then((res) => res.default));
