import { publicProcedure } from "../../../../procedures/public";
import { logoutOutputSchema, LogoutnOutput } from "@my-project/shared";

export const authLogoutProcedure = publicProcedure.output(logoutOutputSchema).mutation(({ ctx }) => {
  ctx.session.destroy();

  return {
    success: true,
  } satisfies LogoutnOutput;
});
