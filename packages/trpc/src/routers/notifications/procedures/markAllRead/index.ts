import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { getUserSub } from "../../utils/getUserSub/index.js";

export const notificationsMarkAllReadProcedure = protectedProcedure.mutation(({ ctx }): { success: true } => {
  const userSub = getUserSub(ctx);

  ctx.notificationsStore.markAllRead({ userSub });

  return { success: true };
});
