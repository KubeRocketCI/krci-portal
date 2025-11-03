import { protectedProcedure } from "../../../../procedures/protected";
import { meOutputSchema, MeOutput } from "@my-project/shared";

export const authMeProcedure = protectedProcedure.output(meOutputSchema).query(async ({ ctx }) => {
  return ctx.session.user?.data satisfies MeOutput;
});
