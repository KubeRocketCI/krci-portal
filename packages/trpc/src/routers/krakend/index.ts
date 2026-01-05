import { t } from "../../trpc.js";
import {
  getDepTrackProjectDataProcedure,
  getSonarQubeProjectDataProcedure,
  getRepositoryListProcedure,
  getOrganizationListProcedure,
  getBranchListProcedure,
  invalidateBranchListCacheProcedure,
  triggerGitLabPipelineProcedure,
} from "./procedures/index.js";

export const krakendRouter = t.router({
  getDepTrackProject: getDepTrackProjectDataProcedure,
  getSonarQubeProject: getSonarQubeProjectDataProcedure,
  getRepositoryList: getRepositoryListProcedure,
  getOrganizationList: getOrganizationListProcedure,
  getBranchList: getBranchListProcedure,
  invalidateBranchListCache: invalidateBranchListCacheProcedure,
  triggerGitLabPipeline: triggerGitLabPipelineProcedure,
});
