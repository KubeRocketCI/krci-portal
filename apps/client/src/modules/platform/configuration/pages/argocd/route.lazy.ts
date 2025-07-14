import { createLazyRoute } from "@tanstack/react-router";
import ArgocdConfigurationPage from "./view";

const ArgocdConfigurationRoute = createLazyRoute("/c/$clusterName/configuration/argocd")({
  component: ArgocdConfigurationPage,
});

export default ArgocdConfigurationRoute;
