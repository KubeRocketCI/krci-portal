import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_TRIVY_CLUSTER_INFRA_ASSESSMENTS } from "./route";
import TrivyClusterInfraAssessmentsPage from "./page";

export default createLazyRoute(ROUTE_ID_TRIVY_CLUSTER_INFRA_ASSESSMENTS)({
  component: TrivyClusterInfraAssessmentsPage,
});
