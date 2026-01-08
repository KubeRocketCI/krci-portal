import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_CONFIG_DEPENDENCY_TRACK } from "./route";
import DependencyTrackConfigurationPage from "./view";

const DependencyTrackConfigurationRoute = createLazyRoute(ROUTE_ID_CONFIG_DEPENDENCY_TRACK)({
  component: DependencyTrackConfigurationPage,
});

export default DependencyTrackConfigurationRoute;
