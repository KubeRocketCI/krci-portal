import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_K8S_NODE_DETAIL } from "./route";
import K8sNodeDetailPage from "./page";

const K8sNodeDetailRoute = createLazyRoute(ROUTE_ID_K8S_NODE_DETAIL)({
  component: K8sNodeDetailPage,
});

export default K8sNodeDetailRoute;
