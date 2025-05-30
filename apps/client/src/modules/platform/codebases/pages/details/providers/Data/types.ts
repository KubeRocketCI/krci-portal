import { UseWatchItemResult } from "@/core/k8s/api/hooks/useWatchItem";
import { UseWatchListResult } from "@/core/k8s/api/hooks/useWatchList";
import { Codebase, CodebaseBranch, GitServer, QuickLink } from "@my-project/shared";

export interface DataContextProviderValue {
  codebaseWatch: UseWatchItemResult<Codebase>;
  codebaseBranchListWatch: UseWatchListResult<CodebaseBranch>;
  gitServerByCodebaseWatch: UseWatchItemResult<GitServer>;
  quickLinkListWatch: UseWatchListResult<QuickLink>;
  codebaseBranches: CodebaseBranch[];
  defaultBranch: CodebaseBranch;
  reviewPipelineName: string;
  buildPipelineName: string;
}
