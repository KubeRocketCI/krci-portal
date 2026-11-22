import { createRoute } from "@tanstack/react-router";
import { routeAgentMode } from "@/core/router/routes";
import { PATH_AGENT_ACTOR_DETAIL } from "../../../constants/paths";
import { actorDetailTabSchema } from "../../../constants/tabs";

export const ROUTE_ID_AGENT_ACTOR_DETAIL = "/_layout/c/$clusterName/agent/actors/$atespace/$name" as const;

export const routeAgentActorDetail = createRoute({
  getParentRoute: () => routeAgentMode,
  path: PATH_AGENT_ACTOR_DETAIL,
  validateSearch: (search: Record<string, unknown>) => actorDetailTabSchema.parse(search),
  head: () => ({ meta: [{ title: "Actor | KRCI" }] }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
