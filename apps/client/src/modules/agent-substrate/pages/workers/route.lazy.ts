import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_AGENT_WORKERS } from "./route";
import AgentWorkersPage from "./page";

const AgentWorkersRoute = createLazyRoute(ROUTE_ID_AGENT_WORKERS)({
  component: AgentWorkersPage,
});

export default AgentWorkersRoute;
