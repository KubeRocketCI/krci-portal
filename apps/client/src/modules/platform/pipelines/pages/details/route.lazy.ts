import { createLazyRoute } from "@tanstack/react-router";
import { PipelineDetailsPage } from "./page";

const PipelineDetailsRoute = createLazyRoute("/c/$clusterName/cicd/pipelines/$namespace/$name")({
  component: PipelineDetailsPage,
});

export default PipelineDetailsRoute;
