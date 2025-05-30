import { createLazyRoute } from "@tanstack/react-router";
import PipelineDetailsPage from "./view";

const PipelineDetailsRoute = createLazyRoute("/c/$clusterName/pipelines/$namespace/$name")({
  component: PipelineDetailsPage,
});

export default PipelineDetailsRoute;
