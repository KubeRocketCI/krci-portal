import { z } from "zod";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { createDependencyTrackClient } from "../../../../clients/dependencyTrack/index.js";

/**
 * Get services for a project from Dependency Track
 * GET /api/v1/service/project/{uuid}
 */
export const getServices = protectedProcedure
  .input(
    z.object({
      uuid: z.string().uuid(),
      pageNumber: z.number().int().min(0).optional().default(0),
      pageSize: z.number().int().min(1).max(100).optional().default(25),
      sortName: z.string().optional(),
      sortOrder: z.enum(["asc", "desc"]).optional(),
    })
  )
  .query(async ({ input }) => {
    const client = createDependencyTrackClient();
    const { uuid, ...params } = input;
    return client.getServices(uuid, params);
  });
