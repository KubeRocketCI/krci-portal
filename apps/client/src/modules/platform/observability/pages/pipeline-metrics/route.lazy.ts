import { createLazyRoute } from "@tanstack/react-router";
import { PATH_PIPELINE_METRICS_FULL } from "./route";
import PipelineMetricsPage from "./page";

export default createLazyRoute(PATH_PIPELINE_METRICS_FULL)({
  component: PipelineMetricsPage,
});
