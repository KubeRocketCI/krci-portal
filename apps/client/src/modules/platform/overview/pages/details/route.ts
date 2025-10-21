import { routeCluster } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_OVERVIEW = "overview/$namespace" as const;
export const PATH_OVERVIEW_FULL = "/c/$clusterName/overview/$namespace" as const;

export const routeOverviewDetails = createRoute({
  getParentRoute: () => routeCluster,
  path: PATH_OVERVIEW,
  head: ({ params }) => ({
    meta: [{ title: `Overview — ${params.namespace} | KRCI` }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
