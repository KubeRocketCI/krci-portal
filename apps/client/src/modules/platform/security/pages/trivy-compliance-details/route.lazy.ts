import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_TRIVY_COMPLIANCE_DETAILS } from "./route";
import TrivyComplianceDetailsPage from "./page";

export default createLazyRoute(ROUTE_ID_TRIVY_COMPLIANCE_DETAILS)({
  component: TrivyComplianceDetailsPage,
});
