import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_PIPELINE_METRICS } from "./route";
import PipelineMetricsPage from "./page";

export default createLazyRoute(ROUTE_ID_PIPELINE_METRICS)({
  component: PipelineMetricsPage,
});
