import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_CDPIPELINE_DETAILS } from "./route";
import CDPipelineDetailsPage from "./page";

const CDPipelineDetailsRoute = createLazyRoute(ROUTE_ID_CDPIPELINE_DETAILS)({
  component: CDPipelineDetailsPage,
});

export default CDPipelineDetailsRoute;
