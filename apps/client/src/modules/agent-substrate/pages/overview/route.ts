import { createRoute } from "@tanstack/react-router";
import { routeAgentMode } from "@/core/router/routes";
import { PATH_AGENT_OVERVIEW } from "../../constants/paths";

export const ROUTE_ID_AGENT_OVERVIEW = "/_layout/c/$clusterName/agent/overview" as const;

export const routeAgentOverview = createRoute({
  getParentRoute: () => routeAgentMode,
  path: PATH_AGENT_OVERVIEW,
  head: () => ({ meta: [{ title: "Fleet Overview | KRCI" }] }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
