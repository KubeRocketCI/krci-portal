import { createLazyRoute } from "@tanstack/react-router";
import { TektonResultPipelineRunDetailsPage } from "./page";
import { ROUTE_ID_TEKTON_RESULT_PIPELINERUN_DETAILS } from "./route";

const TektonResultPipelineRunDetailsRoute = createLazyRoute(ROUTE_ID_TEKTON_RESULT_PIPELINERUN_DETAILS)({
  component: TektonResultPipelineRunDetailsPage,
});

export default TektonResultPipelineRunDetailsRoute;
