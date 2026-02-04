import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_TRIVY_INFRA_ASSESSMENTS } from "./route";
import TrivyInfraAssessmentsPage from "./page";

export default createLazyRoute(ROUTE_ID_TRIVY_INFRA_ASSESSMENTS)({
  component: TrivyInfraAssessmentsPage,
});
