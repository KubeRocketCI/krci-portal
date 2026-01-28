import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_TRIVY_CONFIG_AUDIT_DETAILS } from "./route";
import TrivyConfigAuditDetailsPage from "./page";

export default createLazyRoute(ROUTE_ID_TRIVY_CONFIG_AUDIT_DETAILS)({
  component: TrivyConfigAuditDetailsPage,
});
