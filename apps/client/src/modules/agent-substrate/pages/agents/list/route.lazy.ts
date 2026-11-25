import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_FACTORY_AGENTS } from "./route";
import FactoryAgentsPage from "./page";

const FactoryAgentsRoute = createLazyRoute(ROUTE_ID_FACTORY_AGENTS)({
  component: FactoryAgentsPage,
});

export default FactoryAgentsRoute;
