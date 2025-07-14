import { createLazyRoute } from "@tanstack/react-router";
import NexusConfigurationPage from "./view";

const NexusConfigurationRoute = createLazyRoute("/c/$clusterName/configuration/nexus")({
  component: NexusConfigurationPage,
});

export default NexusConfigurationRoute;
