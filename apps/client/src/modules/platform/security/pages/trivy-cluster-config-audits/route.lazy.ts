import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_TRIVY_CLUSTER_CONFIG_AUDITS } from "./route";
import TrivyClusterConfigAuditsPage from "./page";

export default createLazyRoute(ROUTE_ID_TRIVY_CLUSTER_CONFIG_AUDITS)({
  component: TrivyClusterConfigAuditsPage,
});
