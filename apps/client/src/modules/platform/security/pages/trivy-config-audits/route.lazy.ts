import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_TRIVY_CONFIG_AUDITS } from "./route";
import TrivyConfigAuditsPage from "./page";

export default createLazyRoute(ROUTE_ID_TRIVY_CONFIG_AUDITS)({
  component: TrivyConfigAuditsPage,
});
