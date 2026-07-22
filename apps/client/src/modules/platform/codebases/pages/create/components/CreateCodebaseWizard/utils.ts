import { gitProvider, normalizeGitUrlPath, type Codebase } from "@my-project/shared";
import { sortByName } from "@/core/utils/sortByName";

/** Whether the given Git provider value represents a Gerrit server. */
export const isGerritProvider = (provider: string | null | undefined): boolean => provider === gitProvider.gerrit;

/** Name of the project (Codebase) that already uses the given repository path, if any. */
export const findOnboardedProject = (codebases: Codebase[], candidatePath: string): string | undefined => {
  const normalizedCandidate = normalizeGitUrlPath(candidatePath);
  if (!normalizedCandidate) {
    return undefined;
  }

  return codebases.find((codebase) => normalizeGitUrlPath(codebase.spec.gitUrlPath) === normalizedCandidate)?.metadata
    .name;
};

/** Content-stable key of (name, gitUrlPath) pairs for revalidation effects. */
export const getRepoMembershipKey = (codebases: Codebase[]): string =>
  codebases
    .map((codebase) => `${codebase.metadata.name}:${codebase.spec.gitUrlPath}`)
    .sort(sortByName)
    .join("\n");
