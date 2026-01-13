import { z } from "zod";
import { decodeTektonRecordData, parseRecordName, DecodedLogRecord, TektonResultTaskLogs } from "@my-project/shared";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { createTektonResultsClient } from "../../../../clients/tektonResults/index.js";

/**
 * Get logs for a single TaskRun from Tekton Results
 *
 * This endpoint is designed for lazy-loading: frontend fetches logs only when
 * user selects a task from the menu. This avoids the N+1 query problem of
 * fetching all logs upfront.
 */
export const getTaskRunLogsProcedure = protectedProcedure
  .input(
    z.object({
      namespace: z.string(),
      resultUid: z.string(),
      taskRunName: z.string(),
    })
  )
  .query(async ({ input }) => {
    const { namespace, resultUid, taskRunName } = input;
    const client = createTektonResultsClient(namespace);

    try {
      // List log records for this TaskRun
      const logsResponse = await client.listRecords(resultUid, {
        filter: `data_type == 'results.tekton.dev/v1alpha3.Log' && data.spec.resource.name == '${taskRunName}'`,
        pageSize: 10,
      });

      // Handle cases where records might be undefined or empty
      const records = logsResponse?.records || [];

      if (records.length === 0) {
        return {
          taskName: "", // Will be extracted from taskRunName if needed
          taskRunName,
          logs: "",
          hasLogs: false,
          error: null,
        } satisfies TektonResultTaskLogs;
      }

      // Fetch and concatenate all log records for this TaskRun
      const logParts: string[] = [];

      for (const logRecord of records) {
        const decoded = decodeTektonRecordData<DecodedLogRecord>(logRecord.data.value);
        const status = decoded.status || {};

        if (!status.isStored || status.size === 0) {
          // Log not stored, skip
          continue;
        }

        // Parse record name to get log_uid
        const parsed = parseRecordName(logRecord.name);
        if (!parsed) continue;

        // Fetch actual log content
        const logContent = await client.getLogContent(parsed.resultUid, parsed.recordUid);
        logParts.push(logContent);
      }

      return {
        taskName: "", // Could be extracted from taskRunName or fetched separately if needed
        taskRunName,
        logs: logParts.join("\n") || "No logs available for this TaskRun",
        hasLogs: logParts.length > 0,
        error: null,
      } satisfies TektonResultTaskLogs;
    } catch (error) {
      return {
        taskName: "",
        taskRunName,
        logs: "",
        hasLogs: false,
        error: error instanceof Error ? error.message : "Unknown error",
      } satisfies TektonResultTaskLogs;
    }
  });
