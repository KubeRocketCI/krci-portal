import { t } from "../../trpc.js";
import {
  getRepositoryList,
  getOrganizationList,
  getBranchList,
  invalidateBranchListCache,
  triggerGitLabPipeline,
  getPullRequestList,
} from "./procedures/index.js";

export const gitfusionRouter = t.router({
  getRepositoryList,
  getOrganizationList,
  getBranchList,
  invalidateBranchListCache,
  triggerGitLabPipeline,
  getPullRequestList,
});
