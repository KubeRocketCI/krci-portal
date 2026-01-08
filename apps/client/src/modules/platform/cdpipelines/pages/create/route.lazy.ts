import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_CDPIPELINE_CREATE } from "./route";
import CreateCDPipelinePage from "./page";

const CreateCDPipelineRoute = createLazyRoute(ROUTE_ID_CDPIPELINE_CREATE)({
  component: CreateCDPipelinePage,
});

export default CreateCDPipelineRoute;
