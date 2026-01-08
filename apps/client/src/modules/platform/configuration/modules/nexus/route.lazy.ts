import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_CONFIG_NEXUS } from "./route";
import NexusConfigurationPage from "./view";

const NexusConfigurationRoute = createLazyRoute(ROUTE_ID_CONFIG_NEXUS)({
  component: NexusConfigurationPage,
});

export default NexusConfigurationRoute;
