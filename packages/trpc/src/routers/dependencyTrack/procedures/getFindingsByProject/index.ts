import { z } from "zod";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { createDependencyTrackClient } from "../../../../clients/dependencyTrack/index.js";

/**
 * Get findings (vulnerabilities) for a project from Dependency Track
 * GET /api/v1/finding/project/{uuid}
 */
export const getFindingsByProject = protectedProcedure
  .input(
    z.object({
      uuid: z.string().uuid(),
      suppressed: z.boolean().optional(),
      source: z.string().optional(),
    })
  )
  .query(async ({ input }) => {
    const client = createDependencyTrackClient();
    const { uuid, ...params } = input;
    return client.getFindingsByProject(uuid, params);
  });
