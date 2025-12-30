import { z } from "zod";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { createDependencyTrackClient } from "../../../../clients/dependencyTrack/index.js";

/**
 * Fetch a single project by UUID from Dependency Track
 * GET /api/v1/project/{uuid}
 */
export const getProject = protectedProcedure
  .input(
    z.object({
      uuid: z.string().uuid(),
    })
  )
  .query(async ({ input }) => {
    const client = createDependencyTrackClient();

    return client.getProject(input.uuid);
  });
