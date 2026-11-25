import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_FACTORY_ACTORS } from "./route";
import FactoryActorsPage from "./page";

const FactoryActorsRoute = createLazyRoute(ROUTE_ID_FACTORY_ACTORS)({
  component: FactoryActorsPage,
});

export default FactoryActorsRoute;
