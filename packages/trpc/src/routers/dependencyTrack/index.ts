import { t } from "../../trpc.js";
import {
  getPortfolioMetrics,
  getProjects,
  getProject,
  getProjectMetrics,
  getComponents,
  getServices,
  getDependencyGraph,
  getFindingsByProject,
  getViolationsByProject,
} from "./procedures/index.js";

export const dependencyTrackRouter = t.router({
  getPortfolioMetrics,
  getProjects,
  getProject,
  getProjectMetrics,
  getComponents,
  getServices,
  getDependencyGraph,
  getFindingsByProject,
  getViolationsByProject,
});
