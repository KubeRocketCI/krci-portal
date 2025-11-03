import { createLazyRoute } from "@tanstack/react-router";
import DependencyTrackConfigurationPage from "./view";

const DependencyTrackConfigurationRoute = createLazyRoute("/c/$clusterName/configuration/dependency-track")({
  component: DependencyTrackConfigurationPage,
});

export default DependencyTrackConfigurationRoute;
