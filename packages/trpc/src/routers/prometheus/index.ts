import { t } from "../../trpc.js";
import { getDeploymentMetrics, getExposureMetrics, getPipelineRunMetrics } from "./procedures/index.js";

export const prometheusRouter = t.router({
  getDeploymentMetrics,
  getExposureMetrics,
  getPipelineRunMetrics,
});
