import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_K8S_DETAIL_CLUSTER } from "./route";
import K8sDetailClusterPage from "./page";

const K8sDetailClusterRoute = createLazyRoute(ROUTE_ID_K8S_DETAIL_CLUSTER)({
  component: K8sDetailClusterPage,
});

export default K8sDetailClusterRoute;
