import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { decodeTektonRecordData, DecodedPipelineRun } from "@my-project/shared";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { createTektonResultsClient } from "../../../../clients/tektonResults/index.js";

/**
 * Get a single PipelineRun from Tekton Results by result_uid and record_uid
 *
 * Returns the full decoded PipelineRun data including metadata, spec, and status.
 */
export const getTektonResultPipelineRunProcedure = protectedProcedure
  .input(
    z.object({
      namespace: z.string(),
      resultUid: z.string(),
      recordUid: z.string(),
    })
  )
  .query(async ({ input }) => {
    const { namespace, resultUid, recordUid } = input;
    const client = createTektonResultsClient(namespace);
    const record = await client.getRecord(resultUid, recordUid);

    try {
      const decoded = decodeTektonRecordData<DecodedPipelineRun>(record.data.value);

      return {
        record,
        pipelineRun: decoded,
      };
    } catch (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to decode PipelineRun data: ${err instanceof Error ? err.message : "Unknown error"}`,
      });
    }
  });
