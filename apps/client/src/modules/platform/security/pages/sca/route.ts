import { routeSecurity } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_SCA = "sca/$namespace" as const;
export const PATH_SCA_FULL = "/c/$clusterName/security/sca/$namespace" as const;

export const routeSCA = createRoute({
  getParentRoute: () => routeSecurity,
  path: PATH_SCA,
  head: ({ params }) => ({
    meta: [{ title: `SCA — ${params.namespace} | KRCI` }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
