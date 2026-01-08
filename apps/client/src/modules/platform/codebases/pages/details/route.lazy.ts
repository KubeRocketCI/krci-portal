import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_COMPONENT_DETAILS } from "./route";
import ComponentDetailsPage from "./page";

const ComponentDetailsRoute = createLazyRoute(ROUTE_ID_COMPONENT_DETAILS)({
  component: ComponentDetailsPage,
});

export default ComponentDetailsRoute;
