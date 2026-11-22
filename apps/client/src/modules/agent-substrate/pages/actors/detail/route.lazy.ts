import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_AGENT_ACTOR_DETAIL } from "./route";
import AgentActorDetailPage from "./page";

const AgentActorDetailRoute = createLazyRoute(ROUTE_ID_AGENT_ACTOR_DETAIL)({
  component: AgentActorDetailPage,
});

export default AgentActorDetailRoute;
