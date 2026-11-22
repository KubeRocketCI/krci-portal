import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_AGENT_WORKER_POOLS } from "./route";
import AgentWorkerPoolsPage from "./page";

const AgentWorkerPoolsRoute = createLazyRoute(ROUTE_ID_AGENT_WORKER_POOLS)({
  component: AgentWorkerPoolsPage,
});

export default AgentWorkerPoolsRoute;
