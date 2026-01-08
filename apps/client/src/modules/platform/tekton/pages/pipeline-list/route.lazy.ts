import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_PIPELINES } from "./route";
import PipelineListPage from "./page";

const PipelineListRoute = createLazyRoute(ROUTE_ID_PIPELINES)({
  component: PipelineListPage,
});

export default PipelineListRoute;
