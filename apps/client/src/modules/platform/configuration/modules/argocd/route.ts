import { routeConfiguration } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_CONFIG_ARGOCD = "argocd" as const;
export const PATH_CONFIG_ARGOCD_FULL = "/c/$clusterName/configuration/argocd" as const;

export const routeArgocdConfiguration = createRoute({
  getParentRoute: () => routeConfiguration,
  path: PATH_CONFIG_ARGOCD,
  head: () => ({
    meta: [{ title: "ArgoCD Configuration | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
