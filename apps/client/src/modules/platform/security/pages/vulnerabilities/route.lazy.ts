import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_VULNERABILITIES } from "./route";
import VulnerabilitiesPage from "./page";

export default createLazyRoute(ROUTE_ID_VULNERABILITIES)({
  component: VulnerabilitiesPage,
});
