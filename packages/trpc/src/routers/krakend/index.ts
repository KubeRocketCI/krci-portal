import { t } from "../../trpc.js";
import {
  getPipelineRunLogsProcedure,
  getDepTrackProjectDataProcedure,
  getAllPipelineRunsLogsProcedure,
  getSonarQubeProjectDataProcedure,
  getRepositoryListProcedure,
  getOrganizationListProcedure,
  getBranchListProcedure,
  invalidateBranchListCacheProcedure,
  triggerGitLabPipelineProcedure,
} from "./procedures/index.js";

export const krakendRouter = t.router({
  getPipelineRunLogs: getPipelineRunLogsProcedure,
  getAllPipelineRunsLogs: getAllPipelineRunsLogsProcedure,
  getDepTrackProject: getDepTrackProjectDataProcedure,
  getSonarQubeProject: getSonarQubeProjectDataProcedure,
  getRepositoryList: getRepositoryListProcedure,
  getOrganizationList: getOrganizationListProcedure,
  getBranchList: getBranchListProcedure,
  invalidateBranchListCache: invalidateBranchListCacheProcedure,
  triggerGitLabPipeline: triggerGitLabPipelineProcedure,
});
