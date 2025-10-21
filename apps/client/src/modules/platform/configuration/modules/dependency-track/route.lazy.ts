import { createLazyRoute } from "@tanstack/react-router";
import DependencyTrackConfigurationPage from "./view";

const DependencyTrackConfigurationRoute = createLazyRoute(
  "/content-layout/c/$clusterName/configuration/dependency-track"
)({
  component: DependencyTrackConfigurationPage,
});

export default DependencyTrackConfigurationRoute;
