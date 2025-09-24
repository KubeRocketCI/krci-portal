import { createLazyRoute } from "@tanstack/react-router";
import SonarConfigurationPage from "./view";

const SonarConfigurationRoute = createLazyRoute("/c/$clusterName/configuration/sonar")({
  component: SonarConfigurationPage,
});

export default SonarConfigurationRoute;
