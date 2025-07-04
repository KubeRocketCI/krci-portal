import { createLazyRoute } from "@tanstack/react-router";
import PipelineListPage from "./view";

const PipelineListRoute = createLazyRoute("/c/$clusterName/pipelines")({
  component: PipelineListPage,
});

export default PipelineListRoute;
