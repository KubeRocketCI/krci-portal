import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_TRIVY_CLUSTER_CONFIG_AUDIT_DETAILS } from "./route";
import TrivyClusterConfigAuditDetailsPage from "./page";

export default createLazyRoute(ROUTE_ID_TRIVY_CLUSTER_CONFIG_AUDIT_DETAILS)({
  component: TrivyClusterConfigAuditDetailsPage,
});
