import { z } from "zod";
import { DecodedTaskRun } from "@my-project/shared";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { createTektonResultsClient } from "../../../../clients/tektonResults/index.js";
import { decodeRecords, tektonInputSchemas } from "../../utils.js";

/**
 * Get all TaskRun records for a PipelineRun from Tekton Results.
 *
 * Fetches all records of type `tekton.dev/v1.TaskRun` within a result,
 * decodes them from base64, and returns the full TaskRun data.
 *
 * Used by the unified pipeline detail page to render task tree, diagram,
 * and step details for historical pipeline runs.
 *
 * A pipeline typically has 5-20 tasks, well within a single page (pageSize=50).
 */
export const getTaskRunRecordsProcedure = protectedProcedure
  .input(
    z.object({
      namespace: tektonInputSchemas.namespace,
      resultUid: tektonInputSchemas.uuid,
    })
  )
  .query(async ({ input }) => {
    const { namespace, resultUid } = input;
    const client = createTektonResultsClient(namespace);

    const recordsResponse = await client.listRecords(resultUid, {
      filter: "data_type == 'tekton.dev/v1.TaskRun'",
      pageSize: 50,
    });

    const records = recordsResponse?.records || [];
    const taskRuns = decodeRecords<DecodedTaskRun>(records, "TaskRun");

    return { taskRuns };
  });
