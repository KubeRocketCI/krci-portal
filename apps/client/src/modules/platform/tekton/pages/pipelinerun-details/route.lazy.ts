import { createLazyRoute } from "@tanstack/react-router";
import { PipelineRunDetailsPage } from "./page";

const PipelineRunDetailsRoute = createLazyRoute("/c/$clusterName/cicd/pipelineruns/$namespace/$name")({
  component: PipelineRunDetailsPage,
});

export default PipelineRunDetailsRoute;
