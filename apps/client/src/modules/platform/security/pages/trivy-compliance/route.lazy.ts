import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_TRIVY_COMPLIANCE } from "./route";
import TrivyCompliancePage from "./page";

export default createLazyRoute(ROUTE_ID_TRIVY_COMPLIANCE)({
  component: TrivyCompliancePage,
});
