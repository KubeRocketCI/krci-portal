import { codebaseFindingsInputSchema, codebaseSecurityLineSchema } from "@my-project/shared";
import { createDefectDojoClient, isDefectDojoConfigured } from "../../../../clients/defectDojo/index.js";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { loadCodebaseFacts } from "../../codebaseFindings/facts.js";
import { composeCodebaseSecurityLine } from "../../codebaseFindings/line.js";

/**
 * The security line of the Overview tab of a codebase. Reads the facts as `getCodebaseFindings` does: a user who cannot
 * read the codebase, its branches or its image streams gets the Kubernetes error; one who may not list the Applications
 * or the Stages gets no Environments.
 */
export const getCodebaseSecurityLineProcedure = protectedProcedure
  .input(codebaseFindingsInputSchema)
  .output(codebaseSecurityLineSchema)
  .query(async ({ input, ctx }) => {
    if (!isDefectDojoConfigured(process.env)) {
      return { state: "notConfigured" };
    }

    const facts = await loadCodebaseFacts(ctx.session, input);
    return composeCodebaseSecurityLine(createDefectDojoClient(), facts);
  });
