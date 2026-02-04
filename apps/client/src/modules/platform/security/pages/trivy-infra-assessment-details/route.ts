import { routeSecurity } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_TRIVY_INFRA_ASSESSMENT_DETAILS = "namespace/infra-assessments/$namespace/$name" as const;
export const PATH_TRIVY_INFRA_ASSESSMENT_DETAILS_FULL =
  "/c/$clusterName/security/namespace/infra-assessments/$namespace/$name" as const;
export const ROUTE_ID_TRIVY_INFRA_ASSESSMENT_DETAILS =
  "/_layout/c/$clusterName/security/namespace/infra-assessments/$namespace/$name" as const;

export const routeTrivyInfraAssessmentDetails = createRoute({
  getParentRoute: () => routeSecurity,
  path: PATH_TRIVY_INFRA_ASSESSMENT_DETAILS,
  head: ({ params }) => ({
    meta: [{ title: `Infrastructure Assessment - ${params.name} | KRCI` }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
