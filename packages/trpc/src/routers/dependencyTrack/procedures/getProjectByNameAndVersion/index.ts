import { z } from "zod";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { createDependencyTrackClient } from "../../../../clients/dependencyTrack/index.js";
import { TRPCError } from "@trpc/server";

/**
 * Find a DependencyTrack project by exact name and version
 *
 * Uses direct lookup API endpoint (/v1/project/lookup) for efficient queries.
 * This avoids pagination issues and is much faster than search + filter.
 *
 * Returns the project with the exact name + version combination, or null if not found.
 * When null is returned, the UI will display an empty state with a link to configure
 * DependencyTrack properly.
 *
 * No fallback logic - if the configured defaultBranch doesn't exist in DependencyTrack,
 * this is a configuration issue that should be fixed, not hidden.
 *
 * @input projectName - Name of the DependencyTrack project
 * @input defaultBranch - Default branch/version from Codebase spec (e.g., "main", "develop")
 * @returns Project with metrics, or null if exact match not found
 *
 * @example
 * const project = await trpc.dependencyTrack.getProjectByNameAndVersion.query({
 *   projectName: "my-service",
 *   defaultBranch: "main"
 * });
 */
export const getProjectByNameAndVersion = protectedProcedure
  .input(
    z.object({
      projectName: z.string().describe("Name of the DependencyTrack project"),
      defaultBranch: z.string().describe("Default branch/version from Codebase spec"),
    })
  )
  .query(async ({ input }) => {
    const { projectName, defaultBranch } = input;
    const client = createDependencyTrackClient();

    try {
      // Direct lookup with exact name + version
      const project = await client.getProjectByNameAndVersion(projectName, defaultBranch);

      if (project) {
        console.info(`[DependencyTrack] Found project: ${projectName} (version: ${defaultBranch})`);
        return project;
      }

      // Not found - return null (UI will show empty state with config link)
      console.warn(`[DependencyTrack] Project not found: ${projectName} (version: ${defaultBranch})`);
      return null;
    } catch (error) {
      console.error(`[DependencyTrack] Failed to lookup project: ${projectName}`, error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to lookup project: ${projectName}`,
        cause: error,
      });
    }
  });
