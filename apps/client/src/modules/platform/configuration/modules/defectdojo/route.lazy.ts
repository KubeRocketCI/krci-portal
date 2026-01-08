import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_CONFIG_DEFECTDOJO } from "./route";
import DefectdojoConfigurationPage from "./view";

const DefectdojoConfigurationRoute = createLazyRoute(ROUTE_ID_CONFIG_DEFECTDOJO)({
  component: DefectdojoConfigurationPage,
});

export default DefectdojoConfigurationRoute;
