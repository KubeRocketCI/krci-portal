import { routeSecurity } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_TRIVY_CLUSTER_INFRA_ASSESSMENT_DETAILS = "cluster/infra-assessments/$name" as const;
export const PATH_TRIVY_CLUSTER_INFRA_ASSESSMENT_DETAILS_FULL =
  "/c/$clusterName/security/cluster/infra-assessments/$name" as const;
export const ROUTE_ID_TRIVY_CLUSTER_INFRA_ASSESSMENT_DETAILS =
  "/_layout/c/$clusterName/security/cluster/infra-assessments/$name" as const;

export const routeTrivyClusterInfraAssessmentDetails = createRoute({
  getParentRoute: () => routeSecurity,
  path: PATH_TRIVY_CLUSTER_INFRA_ASSESSMENT_DETAILS,
  head: ({ params }) => ({
    meta: [{ title: `Cluster Infrastructure Assessment - ${params.name} | KRCI` }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
