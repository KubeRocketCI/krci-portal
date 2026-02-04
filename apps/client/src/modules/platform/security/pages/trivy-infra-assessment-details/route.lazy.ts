import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_TRIVY_INFRA_ASSESSMENT_DETAILS } from "./route";
import TrivyInfraAssessmentDetailsPage from "./page";

export default createLazyRoute(ROUTE_ID_TRIVY_INFRA_ASSESSMENT_DETAILS)({
  component: TrivyInfraAssessmentDetailsPage,
});
