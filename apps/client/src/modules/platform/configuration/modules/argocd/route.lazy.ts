import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_CONFIG_ARGOCD } from "./route";
import ArgocdConfigurationPage from "./view";

const ArgocdConfigurationRoute = createLazyRoute(ROUTE_ID_CONFIG_ARGOCD)({
  component: ArgocdConfigurationPage,
});

export default ArgocdConfigurationRoute;
