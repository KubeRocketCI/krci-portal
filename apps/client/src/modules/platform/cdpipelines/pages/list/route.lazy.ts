import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_CDPIPELINES } from "./route";
import CDPipelineListPage from "./page";

const CDPipelineListRoute = createLazyRoute(ROUTE_ID_CDPIPELINES)({
  component: CDPipelineListPage,
});

export default CDPipelineListRoute;
