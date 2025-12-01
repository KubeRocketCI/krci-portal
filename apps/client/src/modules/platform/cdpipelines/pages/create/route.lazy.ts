import { createLazyRoute } from "@tanstack/react-router";
import CreateCDPipelinePage from "./page";

const CreateCDPipelineRoute = createLazyRoute("/c/$clusterName/cdpipelines/create")({
  component: CreateCDPipelinePage,
});

export default CreateCDPipelineRoute;

