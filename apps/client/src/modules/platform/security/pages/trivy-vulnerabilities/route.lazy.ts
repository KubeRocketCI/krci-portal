import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_TRIVY_VULNERABILITIES } from "./route";
import TrivyVulnerabilitiesPage from "./page";

export default createLazyRoute(ROUTE_ID_TRIVY_VULNERABILITIES)({
  component: TrivyVulnerabilitiesPage,
});
