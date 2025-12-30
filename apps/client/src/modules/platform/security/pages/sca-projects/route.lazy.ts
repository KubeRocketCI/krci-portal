import { createLazyRoute } from "@tanstack/react-router";
import { PATH_SCA_PROJECTS_FULL } from "./route";
import SCAProjectsPage from "./page";

export default createLazyRoute(PATH_SCA_PROJECTS_FULL)({
  component: SCAProjectsPage,
});
