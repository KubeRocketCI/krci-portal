import { securityFindingsPageSchema, securityListFindingsInputSchema } from "@my-project/shared";
import { createDefectDojoClient } from "../../../../clients/defectdojo/index.js";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { authorizeCodebase } from "../../authorization.js";
import { SECURITY_ERROR_RESPONSES } from "../../openapi.js";
import { loadRuntimeInput } from "../../runtime.js";
import { getCiFindingsPage, getRuntimeFindingsPage } from "../../summaries.js";

/**
 * Active, non-duplicate findings of a codebase, most severe first, of one scope (CI or
 * runtime), optionally narrowed to one environment and some severities. Runtime findings are those of the
 * namespaces of the Stages the caller can read.
 *
 * The caller must be able to read the Codebase; DefectDojo is not called otherwise.
 */
export const listFindingsProcedure = protectedProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/v1/security/findings",
      protect: true,
      tags: ["security"],
      errorResponses: SECURITY_ERROR_RESPONSES,
    },
  })
  .input(securityListFindingsInputSchema)
  .output(securityFindingsPageSchema)
  .query(async ({ input, ctx }) => {
    await authorizeCodebase(ctx, input.codebase);

    const client = createDefectDojoClient();

    if (input.scope === "ci") {
      return getCiFindingsPage(client, input);
    }

    return getRuntimeFindingsPage(client, input, await loadRuntimeInput(ctx, client, input.codebase));
  });
