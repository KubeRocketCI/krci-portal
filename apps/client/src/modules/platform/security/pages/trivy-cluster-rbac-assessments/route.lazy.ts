import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_TRIVY_CLUSTER_RBAC_ASSESSMENTS } from "./route";
import TrivyClusterRbacAssessmentsPage from "./page";

export default createLazyRoute(ROUTE_ID_TRIVY_CLUSTER_RBAC_ASSESSMENTS)({
  component: TrivyClusterRbacAssessmentsPage,
});
