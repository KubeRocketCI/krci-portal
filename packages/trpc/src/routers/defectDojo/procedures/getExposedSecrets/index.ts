import { exposedSecretsInputSchema, platformFindingsListSchema } from "@my-project/shared";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { SECRET_LIST } from "../../platformFindings/list.js";
import { readPlatformList } from "../../platformFindings/procedure.js";

export const getExposedSecretsProcedure = protectedProcedure
  .input(exposedSecretsInputSchema)
  .output(platformFindingsListSchema)
  .query(({ input, ctx }) => readPlatformList(ctx.session, input, SECRET_LIST));
