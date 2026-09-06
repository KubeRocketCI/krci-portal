import { z } from "zod";
import { type DecodedCustomRun, customRunRecordsOutputSchema, RECORD_TYPES } from "@my-project/shared";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { listDecodedRecords } from "../../utils.js";
import { tektonInputSchemas } from "../../../../schemas/tektonInput.js";

/** All CustomRun records of a PipelineRun result. Custom tasks such as the KRCI ApprovalTask run as CustomRuns. */
export const getCustomRunRecordsProcedure = protectedProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/v1/pipeline-runs/{resultUid}/custom-runs",
      protect: true,
      tags: ["tekton-results"],
    },
  })
  .input(
    z.object({
      namespace: tektonInputSchemas.namespace,
      resultUid: tektonInputSchemas.uuid,
    })
  )
  .output(customRunRecordsOutputSchema)
  .query(async ({ input }) => ({
    customRuns: await listDecodedRecords<DecodedCustomRun>(
      input.namespace,
      input.resultUid,
      RECORD_TYPES.CUSTOM_RUN,
      "CustomRun"
    ),
  }));
