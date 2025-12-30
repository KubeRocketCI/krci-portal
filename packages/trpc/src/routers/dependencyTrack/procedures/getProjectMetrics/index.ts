import { z } from "zod";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { createDependencyTrackClient } from "../../../../clients/dependencyTrack/index.js";

/**
 * Fetch project metrics time series from Dependency Track
 * GET /api/v1/metrics/project/{uuid}/days/{days}
 */
export const getProjectMetrics = protectedProcedure
  .input(
    z.object({
      uuid: z.string().uuid(),
      days: z.number().int().min(1).max(365).default(90),
    })
  )
  .query(async ({ input }) => {
    const client = createDependencyTrackClient();

    return client.getProjectMetrics(input.uuid, input.days);
  });
