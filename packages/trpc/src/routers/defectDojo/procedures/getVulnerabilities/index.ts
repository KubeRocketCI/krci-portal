import { platformFindingsListSchema, vulnerabilitiesInputSchema } from "@my-project/shared";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { VULNERABILITY_LIST } from "../../platformFindings/list.js";
import { readPlatformList } from "../../platformFindings/procedure.js";

export const getVulnerabilitiesProcedure = protectedProcedure
  .input(vulnerabilitiesInputSchema)
  .output(platformFindingsListSchema)
  .query(({ input, ctx }) => readPlatformList(ctx.session, input, VULNERABILITY_LIST));
