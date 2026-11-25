import { createRoute } from "@tanstack/react-router";
import { routeFactoryMode } from "@/core/router/routes";
import { PATH_FACTORY_WORKER_POOLS } from "../../constants/paths";
import { workerPoolsSearchSchema } from "./constants";

export const ROUTE_ID_FACTORY_WORKER_POOLS = "/_layout/c/$clusterName/factory/worker-pools" as const;

export const routeFactoryWorkerPools = createRoute({
  getParentRoute: () => routeFactoryMode,
  path: PATH_FACTORY_WORKER_POOLS,
  validateSearch: (search: Record<string, unknown>) => workerPoolsSearchSchema.parse(search),
  head: () => ({ meta: [{ title: "Worker pools | KRCI" }] }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
