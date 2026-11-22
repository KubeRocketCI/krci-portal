import { createRoute } from "@tanstack/react-router";
import { routeAgentMode } from "@/core/router/routes";
import { PATH_AGENT_WORKERS } from "../../constants/paths";

export const ROUTE_ID_AGENT_WORKERS = "/_layout/c/$clusterName/agent/workers" as const;

export const routeAgentWorkers = createRoute({
  getParentRoute: () => routeAgentMode,
  path: PATH_AGENT_WORKERS,
  head: () => ({ meta: [{ title: "Workers | KRCI" }] }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
