import { t } from "../../trpc.js";
import { getProjects, getProject, getProjectIssues, getQualityGateDetails } from "./procedures/index.js";

export const sonarqubeRouter = t.router({
  getProjects,
  getProject,
  getProjectIssues,
  getQualityGateDetails,
});
