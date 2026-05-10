import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_K8S_POD_DETAIL } from "./route";
import K8sPodDetailPage from "./page";

const K8sPodDetailRoute = createLazyRoute(ROUTE_ID_K8S_POD_DETAIL)({ component: K8sPodDetailPage });
export default K8sPodDetailRoute;
