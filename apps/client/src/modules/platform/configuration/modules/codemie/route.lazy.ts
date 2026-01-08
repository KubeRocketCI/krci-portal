import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_CONFIG_CODEMIE } from "./route";
import CodemieConfigurationPage from "./view";

const CodemieConfigurationRoute = createLazyRoute(ROUTE_ID_CONFIG_CODEMIE)({
  component: CodemieConfigurationPage,
});

export default CodemieConfigurationRoute;
