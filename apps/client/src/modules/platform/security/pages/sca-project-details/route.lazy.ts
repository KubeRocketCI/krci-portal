import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_SCA_PROJECT_DETAILS } from "./route";
import SCAProjectDetailsPage from "./page";

export default createLazyRoute(ROUTE_ID_SCA_PROJECT_DETAILS)({
  component: SCAProjectDetailsPage,
});
