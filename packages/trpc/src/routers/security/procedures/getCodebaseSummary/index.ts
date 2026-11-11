import { securityCodebaseSummaryInputSchema, securityCodebaseSummarySchema } from "@my-project/shared";
import { createDefectDojoClient } from "../../../../clients/defectdojo/index.js";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { authorizeCodebase, getPortalNamespace } from "../../authorization.js";
import { SECURITY_ERROR_RESPONSES } from "../../openapi.js";
import { getCodebaseSummary } from "../../summaries.js";

/**
 * Security summary of a codebase: its CI scans (code and image) and the runtime scans of the
 * environments it runs in, each with the active findings per severity.
 *
 * The caller must be able to read the Codebase; DefectDojo is not called otherwise.
 */
export const getCodebaseSummaryProcedure = protectedProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/v1/security/get",
      protect: true,
      tags: ["security"],
      errorResponses: SECURITY_ERROR_RESPONSES,
    },
  })
  .input(securityCodebaseSummaryInputSchema)
  .output(securityCodebaseSummarySchema)
  .query(async ({ input, ctx }) => {
    await authorizeCodebase(ctx, input.codebase);

    return getCodebaseSummary(createDefectDojoClient(), input.codebase, getPortalNamespace());
  });
