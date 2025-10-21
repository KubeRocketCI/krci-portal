import { createLazyRoute } from "@tanstack/react-router";
import StageDetailsPage from "./page";

const StageDetailsRoute = createLazyRoute(
  "/content-layout/c/$clusterName/cdpipelines/$namespace/$cdPipeline/stages/$stage"
)({
  component: StageDetailsPage,
});

export default StageDetailsRoute;
