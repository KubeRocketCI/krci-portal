import { z } from "zod";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { createDependencyTrackClient } from "../../../../clients/dependencyTrack/index.js";

/**
 * Get dependency graph for a project from Dependency Track
 * GET /api/v1/dependencyGraph/project/{uuid}/directDependencies
 */
export const getDependencyGraph = protectedProcedure
  .input(
    z.object({
      uuid: z.string().uuid(),
    })
  )
  .query(async ({ input }) => {
    const client = createDependencyTrackClient();
    return client.getDependencyGraph(input.uuid);
  });
