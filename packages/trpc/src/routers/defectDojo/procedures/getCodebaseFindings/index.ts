import { codebaseFindingsInputSchema, codebaseFindingsSchema } from "@my-project/shared";
import { createDefectDojoClient, isDefectDojoConfigured } from "../../../../clients/defectDojo/index.js";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { composeCodebaseFindings } from "../../codebaseFindings/compose.js";
import { loadCodebaseFacts } from "../../codebaseFindings/facts.js";

/**
 * The "Security Findings" tab of a codebase: its Code and Image scans with counts per scan.
 * The branches, images and tags come from the Codebase objects the signed-in user can read, not from the browser.
 */
export const getCodebaseFindingsProcedure = protectedProcedure
  .input(codebaseFindingsInputSchema)
  .output(codebaseFindingsSchema)
  .query(async ({ input, ctx }) => {
    if (!isDefectDojoConfigured(process.env)) {
      return { state: "notConfigured" };
    }

    const facts = await loadCodebaseFacts(ctx.session, input);
    return composeCodebaseFindings(createDefectDojoClient(), facts);
  });
