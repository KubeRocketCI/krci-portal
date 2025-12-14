import { createLazyRoute } from "@tanstack/react-router";
import { TektonResultPipelineRunDetailsPage } from "./page";
import { PATH_TEKTON_RESULT_PIPELINERUN_DETAILS_FULL } from "./route";

const TektonResultPipelineRunDetailsRoute = createLazyRoute(PATH_TEKTON_RESULT_PIPELINERUN_DETAILS_FULL)({
  component: TektonResultPipelineRunDetailsPage,
});

export default TektonResultPipelineRunDetailsRoute;
