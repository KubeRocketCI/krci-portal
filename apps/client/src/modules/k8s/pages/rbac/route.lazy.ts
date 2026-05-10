import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_K8S_RBAC } from "./route";
import K8sRbacOverviewPage from "./page";

const K8sRbacOverviewRoute = createLazyRoute(ROUTE_ID_K8S_RBAC)({
  component: K8sRbacOverviewPage,
});

export default K8sRbacOverviewRoute;
