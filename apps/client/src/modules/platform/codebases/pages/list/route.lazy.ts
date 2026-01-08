import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_COMPONENTS } from "./route";
import ComponentListPage from "./page";

const ComponentListRoute = createLazyRoute(ROUTE_ID_COMPONENTS)({
  component: ComponentListPage,
});

export default ComponentListRoute;
