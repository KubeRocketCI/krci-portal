import { routeSecurity } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_TRIVY_RBAC_ASSESSMENT_DETAILS = "namespace/rbac-assessments/$namespace/$name" as const;
export const PATH_TRIVY_RBAC_ASSESSMENT_DETAILS_FULL =
  "/c/$clusterName/security/namespace/rbac-assessments/$namespace/$name" as const;
export const ROUTE_ID_TRIVY_RBAC_ASSESSMENT_DETAILS =
  "/_layout/c/$clusterName/security/namespace/rbac-assessments/$namespace/$name" as const;

export const routeTrivyRbacAssessmentDetails = createRoute({
  getParentRoute: () => routeSecurity,
  path: PATH_TRIVY_RBAC_ASSESSMENT_DETAILS,
  head: ({ params }) => ({
    meta: [{ title: `RBAC Assessment - ${params.name} | KRCI` }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
