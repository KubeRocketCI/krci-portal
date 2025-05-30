import { Codebase, CodebaseBranch } from "@my-project/shared";

export const isDefaultBranch = (codebase: Codebase, codebaseBranch: CodebaseBranch) =>
  codebase.spec.defaultBranch === codebaseBranch.spec.branchName;
