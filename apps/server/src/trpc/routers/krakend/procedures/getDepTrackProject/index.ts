import { protectedProcedure } from "@/trpc/procedures/protected";
import { z } from "zod";

export const getDepTrackProjectProcedure = protectedProcedure
  .input(z.object({ name: z.string() }))
  .query(async ({ input, ctx }) => {
    const { name } = input;
    const { krakendClient } = ctx;
    return await krakendClient.getDepTrackProject(name);
  });
