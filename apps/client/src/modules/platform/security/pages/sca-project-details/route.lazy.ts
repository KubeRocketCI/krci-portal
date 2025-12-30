import { createLazyRoute } from "@tanstack/react-router";
import { PATH_SCA_PROJECT_DETAILS_FULL } from "./route";
import SCAProjectDetailsPage from "./page";

export default createLazyRoute(PATH_SCA_PROJECT_DETAILS_FULL)({
  component: SCAProjectDetailsPage,
});
