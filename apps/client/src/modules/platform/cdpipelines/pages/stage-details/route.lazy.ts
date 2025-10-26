import { createLazyRoute } from "@tanstack/react-router";
import StageDetailsPage from "./page";
import { PATH_CDPIPELINE_STAGE_DETAILS_FULL } from "./route";

const StageDetailsRoute = createLazyRoute(PATH_CDPIPELINE_STAGE_DETAILS_FULL)({
  component: StageDetailsPage,
});

export default StageDetailsRoute;
