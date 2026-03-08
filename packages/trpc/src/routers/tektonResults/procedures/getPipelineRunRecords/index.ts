import { z } from "zod";
import { DecodedPipelineRun } from "@my-project/shared";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { createTektonResultsClient } from "../../../../clients/tektonResults/index.js";
import { decodeRecords, tektonInputSchemas } from "../../utils.js";

/**
 * Get PipelineRun records from Tekton Results for a namespace.
 *
 * Fetches records of type `tekton.dev/v1.PipelineRun` across all results
 * in the namespace (using resultUid="-" wildcard), decodes them from base64,
 * and returns the full PipelineRun data.
 *
 * Used by the unified "Pipelines" tab to merge history data with live K8s data.
 *
 * Supports pagination via pageToken for incremental loading.
 */
export const getPipelineRunRecordsProcedure = protectedProcedure
  .input(
    z.object({
      namespace: tektonInputSchemas.namespace,
      pageSize: z.number().optional().default(50),
      pageToken: z.string().optional(),
      filter: z.string().optional(),
    })
  )
  .query(async ({ input }) => {
    const { namespace, pageSize, pageToken, filter } = input;
    const client = createTektonResultsClient(namespace);

    // Build filter: always require PipelineRun data type, optionally add caller filter
    const dataTypeFilter = "data_type == 'tekton.dev/v1.PipelineRun'";
    const combinedFilter = filter ? `${filter} && ${dataTypeFilter}` : dataTypeFilter;

    // Use resultUid="-" to query records across all results in the namespace
    const recordsResponse = await client.listRecords("-", {
      filter: combinedFilter,
      pageSize,
      pageToken,
      orderBy: "create_time desc",
    });

    const records = recordsResponse?.records || [];
    const pipelineRuns = decodeRecords<DecodedPipelineRun>(records, "PipelineRun");

    return {
      pipelineRuns,
      nextPageToken: recordsResponse?.next_page_token || undefined,
    };
  });
