import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_CONFIG_GITOPS } from "./route";
import GitopsConfigurationPage from "./view";

const GitopsConfigurationRoute = createLazyRoute(ROUTE_ID_CONFIG_GITOPS)({
  component: GitopsConfigurationPage,
});

export default GitopsConfigurationRoute;
