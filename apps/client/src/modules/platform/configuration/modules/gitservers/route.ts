import { routeConfiguration } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_CONFIG_GITSERVERS = "gitservers" as const;
export const PATH_CONFIG_GITSERVERS_FULL = "/c/$clusterName/configuration/gitservers" as const;
export const ROUTE_ID_CONFIG_GITSERVERS = "/_layout/c/$clusterName/configuration/gitservers" as const;

export const routeGitserversConfiguration = createRoute({
  getParentRoute: () => routeConfiguration,
  path: PATH_CONFIG_GITSERVERS,
  head: () => ({
    meta: [{ title: "Git Servers Configuration | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
