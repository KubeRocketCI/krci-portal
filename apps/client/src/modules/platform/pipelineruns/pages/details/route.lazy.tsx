import { createLazyRoute } from "@tanstack/react-router";
import PipelineRunDetailsPage from "./view";

const PipelineRunDetailsRoute = createLazyRoute("/c/$clusterName/pipelineruns/$namespace/$name")({
  component: PipelineRunDetailsPage,
});

export default PipelineRunDetailsRoute;
