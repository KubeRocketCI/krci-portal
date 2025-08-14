import { protectedProcedure } from "@/trpc/procedures/protected";
import { z } from "zod";

export const getDepTrackProjectMetricsProcedure = protectedProcedure
  .input(z.object({ projectID: z.string() }))
  .query(async ({ input, ctx }) => {
    const { projectID } = input;
    const { krakendClient } = ctx;
    return await krakendClient.getDepTrackProjectMetrics(projectID);
  });
