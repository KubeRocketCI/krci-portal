import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_OVERVIEW } from "./route";
import OverviewDetailsPage from "./page";

const OverviewDetailsRoute = createLazyRoute(ROUTE_ID_OVERVIEW)({
  component: OverviewDetailsPage,
});

export default OverviewDetailsRoute;
