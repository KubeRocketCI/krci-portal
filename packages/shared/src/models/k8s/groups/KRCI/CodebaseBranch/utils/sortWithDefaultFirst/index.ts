import type { KubeObjectBase } from "../../../../../common/types.js";
import { sortKubeObjectByCreationTimestamp } from "../../../../../../../utils/sortKubeObjectByCreationTimestamp.js";

export type CodebaseBranchLike = KubeObjectBase & {
  spec: { branchName: string };
};

/**
 * Orders codebase branch CRs for UI lists: the repository default branch first, then
 * remaining branches by {@link sortKubeObjectByCreationTimestamp} (newest first).
 */
export function sortCodebaseBranchesWithDefaultFirst<T extends CodebaseBranchLike>(
  branches: readonly T[],
  defaultBranchName: string | undefined
): T[] {
  const sorted = [...branches].sort(sortKubeObjectByCreationTimestamp);
  if (!defaultBranchName) return sorted;
  const idx = sorted.findIndex((b) => b.spec.branchName === defaultBranchName);
  if (idx <= 0) return sorted;
  const [match] = sorted.splice(idx, 1);
  return [match, ...sorted];
}
