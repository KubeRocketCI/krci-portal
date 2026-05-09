import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_CLUSTER_INTERCEPTORS } from "./route";
import ClusterInterceptorListPage from "./page";

const ClusterInterceptorListRoute = createLazyRoute(ROUTE_ID_CLUSTER_INTERCEPTORS)({
  component: ClusterInterceptorListPage,
});

export default ClusterInterceptorListRoute;
