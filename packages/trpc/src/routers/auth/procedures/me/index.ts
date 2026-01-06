import { MeOutput, OIDCUserSchema } from "@my-project/shared";
import { z } from "zod";
import { protectedProcedure } from "../../../../procedures/protected/index.js";

export const authMeProcedure = protectedProcedure
  .output(
    OIDCUserSchema.extend({
      issuerUrl: z.string().optional(),
    }).optional()
  )
  .query(async ({ ctx }) => {
    const userData = ctx.session.user?.data satisfies MeOutput;
    if (!userData) {
      return undefined;
    }

  return {
    ...userData,
    issuerUrl: ctx.oidcConfig.issuerURL || undefined,
  };
});
