import { createLazyRoute } from "@tanstack/react-router";
import GitopsConfigurationPage from "./view";

const GitopsConfigurationRoute = createLazyRoute("/c/$clusterName/configuration/gitops")({
  component: GitopsConfigurationPage,
});

export default GitopsConfigurationRoute;
