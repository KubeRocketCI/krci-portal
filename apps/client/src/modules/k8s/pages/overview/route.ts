import { createRoute } from "@tanstack/react-router";
import { routeK8sMode } from "@/core/router/routes";
import { PATH_K8S_OVERVIEW_FULL } from "@/modules/k8s/constants/paths";

export const PATH_K8S_OVERVIEW = "overview" as const;
export { PATH_K8S_OVERVIEW_FULL };
export const ROUTE_ID_K8S_OVERVIEW = `/_layout${PATH_K8S_OVERVIEW_FULL}` as const;

export const routeK8sOverview = createRoute({
  getParentRoute: () => routeK8sMode,
  path: PATH_K8S_OVERVIEW,
  head: () => ({
    meta: [{ title: "Cluster Overview | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
