import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_K8S_DETAIL_NS } from "./route";
import K8sDetailNamespacedPage from "./page";

const K8sDetailNamespacedRoute = createLazyRoute(ROUTE_ID_K8S_DETAIL_NS)({
  component: K8sDetailNamespacedPage,
});

export default K8sDetailNamespacedRoute;
