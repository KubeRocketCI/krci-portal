import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_SAST_PROJECT_DETAILS } from "./route";
import SASTProjectDetailsPage from "./page";

export default createLazyRoute(ROUTE_ID_SAST_PROJECT_DETAILS)({
  component: SASTProjectDetailsPage,
});
