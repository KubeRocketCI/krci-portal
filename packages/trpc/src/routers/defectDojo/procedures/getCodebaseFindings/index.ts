import { codebaseFindingsInputSchema, codebaseFindingsSchema } from "@my-project/shared";
import { createDefectDojoClient, isDefectDojoConfigured } from "../../../../clients/defectDojo/index.js";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { composeCodebaseFindings } from "../../codebaseFindings/compose.js";
import { loadCodebaseFacts } from "../../codebaseFindings/facts.js";

/**
 * The "Security Findings" tab of a codebase: its Code and Image scans with counts per scan, and the containers that
 * run in its Environments with their counts.
 * The branches, images, Environments and tags come from the Kubernetes objects the signed-in user can read, not from
 * the browser. A user who cannot read the Applications or the Stages of the namespace gets the Kubernetes error.
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
