import { routeSecurity } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_TRIVY_CLUSTER_RBAC_ASSESSMENT_DETAILS = "cluster/rbac-assessments/$name" as const;
export const PATH_TRIVY_CLUSTER_RBAC_ASSESSMENT_DETAILS_FULL =
  "/c/$clusterName/security/cluster/rbac-assessments/$name" as const;
export const ROUTE_ID_TRIVY_CLUSTER_RBAC_ASSESSMENT_DETAILS =
  "/_layout/c/$clusterName/security/cluster/rbac-assessments/$name" as const;

export const routeTrivyClusterRbacAssessmentDetails = createRoute({
  getParentRoute: () => routeSecurity,
  path: PATH_TRIVY_CLUSTER_RBAC_ASSESSMENT_DETAILS,
  head: ({ params }) => ({
    meta: [{ title: `Cluster RBAC Assessment - ${params.name} | KRCI` }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
