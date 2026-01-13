import { z } from "zod";
import { decodeTektonRecordData, DecodedPipelineRun, TektonResultTask } from "@my-project/shared";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { createTektonResultsClient } from "../../../../clients/tektonResults/index.js";

/**
 * Get list of tasks (with metadata only, no logs) from a PipelineRun in Tekton Results
 *
 * This is a fast, lightweight endpoint that returns just the task names and metadata
 * without fetching logs. Logs are fetched separately on-demand when user selects a task.
 */
export const getTaskListProcedure = protectedProcedure
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

    // Fetch PipelineRun record
    const pipelineRunRecord = await client.getRecord(resultUid, recordUid);
    const pipelineRun = decodeTektonRecordData<DecodedPipelineRun>(pipelineRunRecord.data.value);

    // Extract task list from childReferences
    const childRefs = pipelineRun.status?.childReferences || [];

    const tasks: TektonResultTask[] = childRefs.map((childRef, index) => ({
      taskName: childRef.pipelineTaskName,
      taskRunName: childRef.name,
      order: index,
    }));

    return {
      tasks,
    };
  });
