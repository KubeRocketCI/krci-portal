import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_SAST } from "./route";
import SASTPage from "./page";

export default createLazyRoute(ROUTE_ID_SAST)({
  component: SASTPage,
});
