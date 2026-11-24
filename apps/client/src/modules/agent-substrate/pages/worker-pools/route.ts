import { createRoute } from "@tanstack/react-router";
import { routeAgentMode } from "@/core/router/routes";
import { PATH_AGENT_WORKER_POOLS } from "../../constants/paths";
import { workerPoolsSearchSchema } from "./constants";

export const ROUTE_ID_AGENT_WORKER_POOLS = "/_layout/c/$clusterName/agent/worker-pools" as const;

export const routeAgentWorkerPools = createRoute({
  getParentRoute: () => routeAgentMode,
  path: PATH_AGENT_WORKER_POOLS,
  validateSearch: (search: Record<string, unknown>) => workerPoolsSearchSchema.parse(search),
  head: () => ({ meta: [{ title: "Worker pools | KRCI" }] }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
