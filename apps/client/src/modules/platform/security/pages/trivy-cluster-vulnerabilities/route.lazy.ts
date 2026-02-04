import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_TRIVY_CLUSTER_VULNERABILITIES } from "./route";
import TrivyClusterVulnerabilitiesPage from "./page";

export default createLazyRoute(ROUTE_ID_TRIVY_CLUSTER_VULNERABILITIES)({
  component: TrivyClusterVulnerabilitiesPage,
});
