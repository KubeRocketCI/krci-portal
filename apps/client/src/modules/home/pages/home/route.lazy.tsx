import { createLazyRoute } from "@tanstack/react-router";
import { PATH_HOME_FULL } from "./route";
import HomePage from "./view";

const HomeRoute = createLazyRoute(PATH_HOME_FULL)({
  component: HomePage,
});

export default HomeRoute;
