import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_FACTORY_AGENT_DETAIL } from "./route";
import FactoryAgentDetailPage from "./page";

const FactoryAgentDetailRoute = createLazyRoute(ROUTE_ID_FACTORY_AGENT_DETAIL)({
  component: FactoryAgentDetailPage,
});

export default FactoryAgentDetailRoute;
