import { securityEnvironmentSummaryInputSchema, securityEnvironmentSummarySchema } from "@my-project/shared";
import { createDefectDojoClient } from "../../../../clients/defectdojo/index.js";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { authorizeStage, getPortalNamespace } from "../../authorization.js";
import { SECURITY_ERROR_RESPONSES } from "../../openapi.js";
import { getEnvironmentSummary } from "../../summaries.js";

/**
 * Security summary of an environment (a CD pipeline Stage): the runtime scans of its workloads per
 * application, and of the workloads that belong to no codebase.
 *
 * The caller must be able to read the Stage; DefectDojo is not called otherwise.
 */
export const getEnvironmentSummaryProcedure = protectedProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/v1/security/env",
      protect: true,
      tags: ["security"],
      errorResponses: SECURITY_ERROR_RESPONSES,
    },
  })
  .input(securityEnvironmentSummaryInputSchema)
  .output(securityEnvironmentSummarySchema)
  .query(async ({ input, ctx }) => {
    const { cdPipeline, stage } = await authorizeStage(ctx, input.cdPipeline, input.stage);

    return getEnvironmentSummary(createDefectDojoClient(), cdPipeline, stage, getPortalNamespace());
  });
