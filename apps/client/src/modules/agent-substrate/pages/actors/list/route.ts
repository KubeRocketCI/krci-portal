import { createRoute } from "@tanstack/react-router";
import { routeAgentMode } from "@/core/router/routes";
import { PATH_AGENT_ACTORS } from "../../../constants/paths";

export const ROUTE_ID_AGENT_ACTORS = "/_layout/c/$clusterName/agent/actors" as const;

export const routeAgentActors = createRoute({
  getParentRoute: () => routeAgentMode,
  path: PATH_AGENT_ACTORS,
  head: () => ({ meta: [{ title: "Actors | KRCI" }] }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
