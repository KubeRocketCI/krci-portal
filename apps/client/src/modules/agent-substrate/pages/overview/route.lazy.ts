import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_FACTORY_OVERVIEW } from "./route";
import FactoryOverviewPage from "./page";

const FactoryOverviewRoute = createLazyRoute(ROUTE_ID_FACTORY_OVERVIEW)({
  component: FactoryOverviewPage,
});

export default FactoryOverviewRoute;
