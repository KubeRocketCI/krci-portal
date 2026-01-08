import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_CONFIG_REGISTRY } from "./route";
import RegistryConfigurationPage from "./view";

const RegistryConfigurationRoute = createLazyRoute(ROUTE_ID_CONFIG_REGISTRY)({
  component: RegistryConfigurationPage,
});

export default RegistryConfigurationRoute;
