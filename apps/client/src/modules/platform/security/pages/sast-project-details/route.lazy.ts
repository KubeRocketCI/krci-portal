import { createLazyRoute } from "@tanstack/react-router";
import { PATH_SAST_PROJECT_DETAILS_FULL } from "./route";
import SASTProjectDetailsPage from "./page";

export default createLazyRoute(PATH_SAST_PROJECT_DETAILS_FULL)({
  component: SASTProjectDetailsPage,
});
