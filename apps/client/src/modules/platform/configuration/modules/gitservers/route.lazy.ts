import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_CONFIG_GITSERVERS } from "./route";
import GitserversConfigurationPage from "./view";

const GitserversConfigurationRoute = createLazyRoute(ROUTE_ID_CONFIG_GITSERVERS)({
  component: GitserversConfigurationPage,
});

export default GitserversConfigurationRoute;
