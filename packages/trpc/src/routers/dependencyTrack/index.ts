import { t } from "../../trpc.js";
import {
  getPortfolioMetrics,
  getProjects,
  getProject,
  getProjectByNameAndVersion,
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
  getProjectByNameAndVersion,
  getProjectMetrics,
  getComponents,
  getServices,
  getDependencyGraph,
  getFindingsByProject,
  getViolationsByProject,
});
