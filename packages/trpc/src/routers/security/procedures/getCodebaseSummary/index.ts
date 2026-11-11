import { securityCodebaseSummaryInputSchema, securityCodebaseSummarySchema } from "@my-project/shared";
import { createDefectDojoClient } from "../../../../clients/defectdojo/index.js";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { authorizeCodebase } from "../../authorization.js";
import { SECURITY_ERROR_RESPONSES } from "../../openapi.js";
import { loadRuntimeInput } from "../../runtime.js";
import { getCodebaseSummary } from "../../summaries.js";

/**
 * Security summary of a codebase: its CI scans (code and image) and the runtime scans of the
 * environments it runs in, each with the active findings per severity.
 *
 * The caller must be able to read the Codebase; DefectDojo is not called otherwise. The runtime scans are those of
 * the namespaces of the Stages the caller can read; a caller who may not list the CD pipelines, Stages or
 * CodebaseImageStreams gets the CI scans only.
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

    const client = createDefectDojoClient();

    return getCodebaseSummary(client, input.codebase, await loadRuntimeInput(ctx, client, input.codebase));
  });
