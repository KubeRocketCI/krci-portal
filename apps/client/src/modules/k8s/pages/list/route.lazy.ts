import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_K8S_LIST } from "./route";
import K8sResourceListPage from "./page";

const K8sResourceListRoute = createLazyRoute(ROUTE_ID_K8S_LIST)({
  component: K8sResourceListPage,
});

export default K8sResourceListRoute;
