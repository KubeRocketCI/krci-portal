import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_TRIVY_OVERVIEW } from "./route";
import TrivyOverviewPage from "./page";

export default createLazyRoute(ROUTE_ID_TRIVY_OVERVIEW)({
  component: TrivyOverviewPage,
});
