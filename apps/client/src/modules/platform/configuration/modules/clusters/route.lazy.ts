import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_CONFIG_CLUSTERS } from "./route";
import ClustersConfigurationPage from "./view";

const ClustersConfigurationRoute = createLazyRoute(ROUTE_ID_CONFIG_CLUSTERS)({
  component: ClustersConfigurationPage,
});

export default ClustersConfigurationRoute;
