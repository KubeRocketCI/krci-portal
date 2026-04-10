/**
 * Builds the initial ui_applicationsFieldArray by matching branches to applications
 * using the naming convention, regardless of array index positions.
 *
 * Branch names follow the pattern: {appName}-{branchName}[-{hash}]
 * This function searches inputDockerStreams for branches that start with each app's name,
 * enabling correct initialization even when the arrays are in different orders.
 *
 * @param applications - Array of application names from CDPipeline.spec.applications
 * @param inputDockerStreams - Array of branch names from CDPipeline.spec.inputDockerStreams
 * @returns Array of {appName, appBranch} tuples with correctly matched branches
 */
export function buildInitialApplicationBranches(
  applications: string[],
  inputDockerStreams: string[]
): Array<{ appName: string; appBranch: string }> {
  return applications.map((appName) => {
    const appPrefix = `${appName}-`;

    // Find all streams that start with this app's prefix
    const candidates = inputDockerStreams.filter((stream) => stream.startsWith(appPrefix));

    // Filter out streams that actually belong to a longer app name.
    // For example, if appName="app" and we have "app-extended" in applications,
    // then "app-extended-main" should not match "app" (even though it starts with "app-")
    const matchedBranch = candidates.find((stream) => {
      const isBetterMatchAvailable = applications.some(
        (otherApp) => otherApp !== appName && otherApp.startsWith(appName) && stream.startsWith(`${otherApp}-`)
      );
      return !isBetterMatchAvailable;
    });

    return {
      appName,
      appBranch: matchedBranch ?? "",
    };
  });
}
