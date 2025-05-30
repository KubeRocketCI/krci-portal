import { Codebase, CodebaseBranch } from "@my-project/shared";

export interface TableHeaderActionsProps {
  codebase: Codebase;
  defaultBranch: CodebaseBranch;
  sortedCodebaseBranchList: CodebaseBranch[];
  reviewPipelineName: string;
  buildPipelineName: string;
}
