import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_TRIVY_CLUSTER_RBAC_ASSESSMENT_DETAILS } from "./route";
import TrivyClusterRbacAssessmentDetailsPage from "./page";

export default createLazyRoute(ROUTE_ID_TRIVY_CLUSTER_RBAC_ASSESSMENT_DETAILS)({
  component: TrivyClusterRbacAssessmentDetailsPage,
});
