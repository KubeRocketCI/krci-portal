import { createLazyRoute } from "@tanstack/react-router";
import RegistryConfigurationPage from "./view";

const RegistryConfigurationRoute = createLazyRoute("/c/$clusterName/configuration/registry")({
  component: RegistryConfigurationPage,
});

export default RegistryConfigurationRoute;
