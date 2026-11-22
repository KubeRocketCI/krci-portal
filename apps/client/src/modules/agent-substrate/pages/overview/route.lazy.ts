import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_AGENT_OVERVIEW } from "./route";
import AgentOverviewPage from "./page";

const AgentOverviewRoute = createLazyRoute(ROUTE_ID_AGENT_OVERVIEW)({
  component: AgentOverviewPage,
});

export default AgentOverviewRoute;
