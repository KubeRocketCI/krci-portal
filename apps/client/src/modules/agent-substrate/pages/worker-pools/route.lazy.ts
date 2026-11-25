import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_FACTORY_WORKER_POOLS } from "./route";
import FactoryWorkerPoolsPage from "./page";

const FactoryWorkerPoolsRoute = createLazyRoute(ROUTE_ID_FACTORY_WORKER_POOLS)({
  component: FactoryWorkerPoolsPage,
});

export default FactoryWorkerPoolsRoute;
