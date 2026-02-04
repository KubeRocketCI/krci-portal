import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_TRIVY_RBAC_ASSESSMENTS } from "./route";
import TrivyRbacAssessmentsPage from "./page";

export default createLazyRoute(ROUTE_ID_TRIVY_RBAC_ASSESSMENTS)({
  component: TrivyRbacAssessmentsPage,
});
