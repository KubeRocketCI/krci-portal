import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_PIPELINERUN_DETAILS } from "./route";
import { PipelineRunDetailsPage } from "./page";

const PipelineRunDetailsRoute = createLazyRoute(ROUTE_ID_PIPELINERUN_DETAILS)({
  component: PipelineRunDetailsPage,
});

export default PipelineRunDetailsRoute;
