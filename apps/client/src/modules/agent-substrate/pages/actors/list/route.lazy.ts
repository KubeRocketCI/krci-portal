import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_AGENT_ACTORS } from "./route";
import AgentActorsPage from "./page";

const AgentActorsRoute = createLazyRoute(ROUTE_ID_AGENT_ACTORS)({
  component: AgentActorsPage,
});

export default AgentActorsRoute;
