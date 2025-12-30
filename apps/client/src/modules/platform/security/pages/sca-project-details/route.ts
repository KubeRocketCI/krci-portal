import { routeSecurity } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_SCA_PROJECT_DETAILS = "sca/projects/$namespace/$projectUuid" as const;
export const PATH_SCA_PROJECT_DETAILS_FULL = "/c/$clusterName/security/sca/projects/$namespace/$projectUuid" as const;

export const routeSCAProjectDetails = createRoute({
  getParentRoute: () => routeSecurity,
  path: PATH_SCA_PROJECT_DETAILS,
  head: ({ params }) => ({
    meta: [{ title: `Project Details — ${params.namespace} | KRCI` }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
