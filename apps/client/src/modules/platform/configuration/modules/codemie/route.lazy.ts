import { createLazyRoute } from "@tanstack/react-router";
import CodemieConfigurationPage from "./view";

const CodemieConfigurationRoute = createLazyRoute("/c/$clusterName/configuration/codemie")({
  component: CodemieConfigurationPage,
});

export default CodemieConfigurationRoute;
