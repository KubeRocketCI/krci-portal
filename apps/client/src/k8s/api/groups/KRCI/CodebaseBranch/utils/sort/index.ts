import { checkIsDefaultBranch, Codebase, CodebaseBranch } from "@my-project/shared";

/**
 * Sorts codebase branches array with default branch first
 */
export const sortCodebaseBranches = (codebaseBranches: CodebaseBranch[], codebase: Codebase) => {
  return codebaseBranches.sort((a) => (checkIsDefaultBranch(codebase, a) ? -1 : 1));
};

/**
 * Sorts codebase branches Map with default branch first
 * Returns a new Map with items in sorted order
 */
export const sortCodebaseBranchesMap = (
  codebaseBranches: Map<string, CodebaseBranch>,
  codebase: Codebase
): Map<string, CodebaseBranch> => {
  const sorted = Array.from(codebaseBranches.values()).sort((a) => (checkIsDefaultBranch(codebase, a) ? -1 : 1));
  return new Map(sorted.map((item) => [item.metadata.name!, item]));
};
