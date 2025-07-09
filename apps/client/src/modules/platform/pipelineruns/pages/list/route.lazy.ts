import { createLazyRoute } from "@tanstack/react-router";
import PipelineRunListPage from "./view";

const PipelineRunListRoute = createLazyRoute("/c/$clusterName/pipelineruns")({
  component: PipelineRunListPage,
});

export default PipelineRunListRoute;
