/**
 * Resolves the correct branch for an application when the CDPipeline spec may
 * have misaligned inputDockerStreams. Mirrors the cd-pipeline-operator's
 * label-based lookup approach.
 *
 * @param currentBranch - The branch value currently stored at this app's index
 * @param appBranchNames - Set of CodebaseBranch metadata.names for this app (from K8s labels)
 * @param originalStreams - The immutable original CDPipeline.spec.inputDockerStreams
 * @param fallbackBranch - The default/first branch to use if no match found
 * @returns The resolved branch metadata.name, or undefined if no branches available
 */
export function resolveApplicationBranch(
  currentBranch: string,
  appBranchNames: Set<string>,
  originalStreams: string[],
  fallbackBranch: string | undefined
): string | undefined {
  if (currentBranch && appBranchNames.has(currentBranch)) {
    return currentBranch;
  }

  const matchedStream = originalStreams.find((stream) => appBranchNames.has(stream));

  if (matchedStream) {
    return matchedStream;
  }

  return fallbackBranch;
}
