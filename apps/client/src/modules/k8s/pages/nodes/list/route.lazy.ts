import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_K8S_NODES } from "./route";
import K8sNodesListPage from "./page";

const K8sNodesListRoute = createLazyRoute(ROUTE_ID_K8S_NODES)({
  component: K8sNodesListPage,
});

export default K8sNodesListRoute;
