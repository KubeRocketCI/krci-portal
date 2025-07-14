import { routeCluster } from "@/core/router";
import { createRoute } from "@tanstack/react-router";

export const routeJiraConfiguration = createRoute({
  getParentRoute: () => routeCluster,
  path: "/configuration/jira",
}).lazy(() => import("./route.lazy").then((res) => res.default));
