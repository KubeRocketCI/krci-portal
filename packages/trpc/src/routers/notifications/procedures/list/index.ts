import { z } from "zod";
import type { NotificationListItem } from "@my-project/shared";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { getUserSub } from "../../utils/getUserSub/index.js";

export const notificationsListInputSchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
});

export const notificationsListProcedure = protectedProcedure
  .input(notificationsListInputSchema)
  .query(({ ctx, input }): NotificationListItem[] => {
    const userSub = getUserSub(ctx);

    return ctx.notificationsStore.list({
      userSub,
      limit: input.limit,
    });
  });
