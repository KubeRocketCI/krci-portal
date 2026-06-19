import { t } from "../../trpc.js";
import { getDeploymentMetrics, getExposureMetrics } from "./procedures/index.js";

export const prometheusRouter = t.router({
  getDeploymentMetrics,
  getExposureMetrics,
});
