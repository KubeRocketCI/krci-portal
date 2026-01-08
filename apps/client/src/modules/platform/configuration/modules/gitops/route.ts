import { routeConfiguration } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_CONFIG_GITOPS = "gitops" as const;
export const PATH_CONFIG_GITOPS_FULL = "/c/$clusterName/configuration/gitops" as const;
export const ROUTE_ID_CONFIG_GITOPS = "/_layout/c/$clusterName/configuration/gitops" as const;

export const routeGitopsConfiguration = createRoute({
  getParentRoute: () => routeConfiguration,
  path: PATH_CONFIG_GITOPS,
  head: () => ({
    meta: [{ title: "GitOps Configuration | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
