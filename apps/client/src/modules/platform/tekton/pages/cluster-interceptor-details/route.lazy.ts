import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_CLUSTER_INTERCEPTOR_DETAILS } from "./route";
import ClusterInterceptorDetailsPage from "./page";

const ClusterInterceptorDetailsRoute = createLazyRoute(ROUTE_ID_CLUSTER_INTERCEPTOR_DETAILS)({
  component: ClusterInterceptorDetailsPage,
});
export default ClusterInterceptorDetailsRoute;
