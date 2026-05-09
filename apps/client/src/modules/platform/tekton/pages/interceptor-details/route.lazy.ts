import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_INTERCEPTOR_DETAILS } from "./route";
import InterceptorDetailsPage from "./page";

const InterceptorDetailsRoute = createLazyRoute(ROUTE_ID_INTERCEPTOR_DETAILS)({ component: InterceptorDetailsPage });
export default InterceptorDetailsRoute;
