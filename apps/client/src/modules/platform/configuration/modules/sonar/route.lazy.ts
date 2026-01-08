import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_CONFIG_SONAR } from "./route";
import SonarConfigurationPage from "./view";

const SonarConfigurationRoute = createLazyRoute(ROUTE_ID_CONFIG_SONAR)({
  component: SonarConfigurationPage,
});

export default SonarConfigurationRoute;
