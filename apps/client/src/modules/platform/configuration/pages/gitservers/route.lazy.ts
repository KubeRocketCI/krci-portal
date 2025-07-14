import { createLazyRoute } from "@tanstack/react-router";
import GitserversConfigurationPage from "./view";

const GitserversConfigurationRoute = createLazyRoute("/c/$clusterName/configuration/gitservers")({
  component: GitserversConfigurationPage,
});

export default GitserversConfigurationRoute;
