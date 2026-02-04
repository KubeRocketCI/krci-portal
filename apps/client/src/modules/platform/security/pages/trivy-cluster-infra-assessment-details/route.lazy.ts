import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_TRIVY_CLUSTER_INFRA_ASSESSMENT_DETAILS } from "./route";
import TrivyClusterInfraAssessmentDetailsPage from "./page";

export default createLazyRoute(ROUTE_ID_TRIVY_CLUSTER_INFRA_ASSESSMENT_DETAILS)({
  component: TrivyClusterInfraAssessmentDetailsPage,
});
