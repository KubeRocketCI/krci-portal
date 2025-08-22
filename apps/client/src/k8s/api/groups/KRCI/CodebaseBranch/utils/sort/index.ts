import { checkIsDefaultBranch, Codebase, CodebaseBranch } from "@my-project/shared";

export const sortCodebaseBranches = (codebaseBranches: CodebaseBranch[], codebase: Codebase) => {
  return codebaseBranches.sort((a) => (checkIsDefaultBranch(codebase, a) ? -1 : 1));
};
