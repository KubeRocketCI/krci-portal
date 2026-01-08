import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_SCA_PROJECTS } from "./route";
import SCAProjectsPage from "./page";

export default createLazyRoute(ROUTE_ID_SCA_PROJECTS)({
  component: SCAProjectsPage,
});
