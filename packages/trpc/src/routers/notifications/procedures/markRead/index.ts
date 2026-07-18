import { z } from "zod";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { getUserSub } from "../../utils/getUserSub/index.js";

export const notificationsMarkReadInputSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

export const notificationsMarkReadProcedure = protectedProcedure
  .input(notificationsMarkReadInputSchema)
  .mutation(({ ctx, input }): { success: true } => {
    const userSub = getUserSub(ctx);

    ctx.notificationsStore.markRead({ userSub, ids: input.ids });

    return { success: true };
  });
