import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_INTERCEPTORS } from "./route";
import InterceptorListPage from "./page";

const InterceptorListRoute = createLazyRoute(ROUTE_ID_INTERCEPTORS)({
  component: InterceptorListPage,
});

export default InterceptorListRoute;
