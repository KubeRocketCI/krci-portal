import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_TRIVY_RBAC_ASSESSMENT_DETAILS } from "./route";
import TrivyRbacAssessmentDetailsPage from "./page";

export default createLazyRoute(ROUTE_ID_TRIVY_RBAC_ASSESSMENT_DETAILS)({
  component: TrivyRbacAssessmentDetailsPage,
});
