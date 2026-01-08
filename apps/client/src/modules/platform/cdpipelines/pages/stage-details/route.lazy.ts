import { createLazyRoute } from "@tanstack/react-router";
import StageDetailsPage from "./page";
import { ROUTE_ID_CDPIPELINE_STAGE_DETAILS } from "./route";

const StageDetailsRoute = createLazyRoute(ROUTE_ID_CDPIPELINE_STAGE_DETAILS)({
  component: StageDetailsPage,
});

export default StageDetailsRoute;
