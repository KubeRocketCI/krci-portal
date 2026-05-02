import { t } from "../../trpc.js";
import { getDeploymentMetrics } from "./procedures/index.js";

export const prometheusRouter = t.router({
  getDeploymentMetrics,
});
