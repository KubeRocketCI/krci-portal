import { createLazyRoute } from "@tanstack/react-router";
import ClustersConfigurationPage from "./view";

const ClustersConfigurationRoute = createLazyRoute("/c/$clusterName/configuration/clusters")({
  component: ClustersConfigurationPage,
});

export default ClustersConfigurationRoute;
