import { routeSecurity } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_SCA_PROJECTS = "sca/projects/$namespace" as const;
export const PATH_SCA_PROJECTS_FULL = "/c/$clusterName/security/sca/projects/$namespace" as const;

export const routeSCAProjects = createRoute({
  getParentRoute: () => routeSecurity,
  path: PATH_SCA_PROJECTS,
  head: ({ params }) => ({
    meta: [{ title: `SCA Projects — ${params.namespace} | KRCI` }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
