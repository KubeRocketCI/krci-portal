import { createLazyRoute } from "@tanstack/react-router";
import CDPipelineDetailsPage from "./page";

const CDPipelineDetailsRoute = createLazyRoute("/c/$clusterName/cdpipelines/$namespace/$name")({
  component: CDPipelineDetailsPage,
});

export default CDPipelineDetailsRoute;
