import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_K8S_PODS } from "./route";
import K8sPodsListPage from "./page";

const K8sPodsListRoute = createLazyRoute(ROUTE_ID_K8S_PODS)({
  component: K8sPodsListPage,
});

export default K8sPodsListRoute;
