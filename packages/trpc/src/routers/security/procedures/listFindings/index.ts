import { securityFindingsPageSchema, securityListFindingsInputSchema } from "@my-project/shared";
import { createDefectDojoClient } from "../../../../clients/defectdojo/index.js";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { authorizeCodebase, getPortalNamespace } from "../../authorization.js";
import { SECURITY_ERROR_RESPONSES } from "../../openapi.js";
import { getFindingsPage } from "../../summaries.js";

/**
 * Active, non-duplicate findings of a codebase, most severe first, of one scope (CI or
 * runtime), optionally narrowed to one environment and some severities. Runtime findings come only from
 * tests tagged with the tenant of the portal.
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

    return getFindingsPage(createDefectDojoClient(), input, getPortalNamespace());
  });
