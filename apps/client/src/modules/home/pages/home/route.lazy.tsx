import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_HOME_ID } from "./route";
import HomePage from "./view";

const HomeRoute = createLazyRoute(ROUTE_HOME_ID)({
  component: HomePage,
});

export default HomeRoute;
