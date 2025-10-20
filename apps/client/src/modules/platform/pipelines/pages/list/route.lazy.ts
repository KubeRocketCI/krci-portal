import { createLazyRoute } from "@tanstack/react-router";
import PipelineListPage from "./page";

const PipelineListRoute = createLazyRoute("/c/$clusterName/cicd/pipelines")({
  component: PipelineListPage,
});

export default PipelineListRoute;
