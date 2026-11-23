import { scanFindingsInputSchema, scanFindingsSchema } from "@my-project/shared";
import { createDefectDojoClient, isDefectDojoConfigured } from "../../../../clients/defectDojo/index.js";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { readScanFindings } from "../../codebaseFindings/compose.js";
import { loadCodebaseFacts } from "../../codebaseFindings/facts.js";

/**
 * One page of the findings of a scan of a codebase, most severe first. The scan is named by its typed identity
 * (level, branch, scanner, image); the server resolves its DefectDojo test.
 */
export const getScanFindingsProcedure = protectedProcedure
  .input(scanFindingsInputSchema)
  .output(scanFindingsSchema)
  .query(async ({ input, ctx }) => {
    if (!isDefectDojoConfigured(process.env)) {
      return { state: "notConfigured" };
    }

    const facts = await loadCodebaseFacts(ctx.session, input);
    return readScanFindings(createDefectDojoClient(), facts, input);
  });
