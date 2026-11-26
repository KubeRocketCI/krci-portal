import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_SECURITY_OVERVIEW } from "./route";
import SecurityOverviewPage from "./page";

export default createLazyRoute(ROUTE_ID_SECURITY_OVERVIEW)({
  component: SecurityOverviewPage,
});
