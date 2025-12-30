import { z } from "zod";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { createDependencyTrackClient } from "../../../../clients/dependencyTrack/index.js";

/**
 * tRPC procedure to get policy violations for a specific project
 */
export const getViolationsByProject = protectedProcedure
  .input(
    z.object({
      uuid: z.string().uuid(),
      suppressed: z.boolean().optional(),
      pageNumber: z.number().int().min(0).optional().default(0),
      pageSize: z.number().int().min(1).max(100).optional().default(25),
    })
  )
  .query(async ({ input }) => {
    const client = createDependencyTrackClient();
    return client.getViolationsByProject(input.uuid, {
      suppressed: input.suppressed,
      pageNumber: input.pageNumber,
      pageSize: input.pageSize,
    });
  });
