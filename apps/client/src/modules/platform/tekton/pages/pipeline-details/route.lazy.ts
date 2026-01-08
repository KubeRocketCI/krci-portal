import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_PIPELINE_DETAILS } from "./route";
import { PipelineDetailsPage } from "./page";

const PipelineDetailsRoute = createLazyRoute(ROUTE_ID_PIPELINE_DETAILS)({
  component: PipelineDetailsPage,
});

export default PipelineDetailsRoute;
