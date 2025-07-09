import { createLazyRoute } from "@tanstack/react-router";
import StageDetailsPage from "./view";

const StageDetailsRoute = createLazyRoute("/c/$clusterName/cdpipelines/$namespace/$CDPipelineName/$stageName")({
  component: StageDetailsPage,
});

export default StageDetailsRoute;
