import { t } from "../..";
import {
  getPipelineRunLogsProcedure,
  getDepTrackProjectDataProcedure,
  getAllPipelineRunsLogsProcedure,
  getSonarQubeProjectDataProcedure,
  getRepositoryListProcedure,
  getOrganizationListProcedure,
  getBranchListProcedure,
  invalidateBranchListCacheProcedure,
} from "./procedures";

export const krakendRouter = t.router({
  getPipelineRunLogs: getPipelineRunLogsProcedure,
  getAllPipelineRunsLogs: getAllPipelineRunsLogsProcedure,
  getDepTrackProject: getDepTrackProjectDataProcedure,
  getSonarQubeProject: getSonarQubeProjectDataProcedure,
  getRepositoryList: getRepositoryListProcedure,
  getOrganizationList: getOrganizationListProcedure,
  getBranchList: getBranchListProcedure,
  invalidateBranchListCache: invalidateBranchListCacheProcedure,
});
