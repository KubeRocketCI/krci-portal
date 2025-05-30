import { createLazyRoute } from "@tanstack/react-router";
import CDPipelineListPage from "./view";

const CDPipelineListRoute = createLazyRoute("/c/$clusterName/cdpipelines")({
  component: CDPipelineListPage,
});

export default CDPipelineListRoute;
