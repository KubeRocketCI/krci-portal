import { z } from "zod";
import { decodeTektonRecordData, parseRecordName, DecodedLogRecord, TektonResultTaskLogs } from "@my-project/shared";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { createTektonResultsClient } from "../../../../clients/tektonResults/index.js";
import { tektonInputSchemas } from "../../utils.js";

/**
 * Get logs for a single TaskRun from Tekton Results
 *
 * This endpoint is designed for lazy-loading: frontend fetches logs only when
 * user selects a task from the menu. This avoids the N+1 query problem of
 * fetching all logs upfront.
 */
export const getTaskRunLogsProcedure = protectedProcedure
  .meta({
    openapi: { method: "GET", path: "/v1/task-runs/{resultUid}/logs", protect: true, tags: ["tekton-results"] },
  })
  .input(
    z.object({
      namespace: tektonInputSchemas.namespace,
      resultUid: tektonInputSchemas.uuid,
      taskRunName: tektonInputSchemas.k8sName,
      stepName: tektonInputSchemas.stepName.optional(),
    })
  )
  .output(
    z.object({
      taskName: z.string(),
      taskRunName: z.string(),
      logs: z.string(),
      hasLogs: z.boolean(),
      error: z.string().nullable(),
      stepFiltered: z.boolean().optional(),
    })
  )
  .query(async ({ input }) => {
    const { namespace, resultUid, taskRunName, stepName } = input;
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
          stepFiltered: undefined,
        } satisfies TektonResultTaskLogs;
      }

      // Identify fetchable log records (stored, non-empty, parseable name)
      const fetchableRecords = records
        .map((logRecord) => {
          const decoded = decodeTektonRecordData<DecodedLogRecord>(logRecord.data.value);
          const status = decoded.status || {};

          if (!status.isStored || status.size === 0) return null;

          const parsed = parseRecordName(logRecord.name);
          if (!parsed) return null;

          return parsed;
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);

      // Fetch all log contents in parallel
      const logParts = await Promise.all(
        fetchableRecords.map((parsed) => client.getLogContent(parsed.resultUid, parsed.recordUid))
      );

      let logs = logParts.join("\n");
      let stepFiltered: boolean | undefined;

      // If stepName is provided, filter log lines by [stepName] prefix
      if (stepName && logs) {
        const prefix = `[${stepName}]`;
        const filteredLines = logs
          .split("\n")
          .filter((line) => line.startsWith(prefix))
          .map((line) => line.slice(prefix.length).trimStart());

        // Graceful degradation: if no matches found, return full log
        if (filteredLines.length > 0) {
          logs = filteredLines.join("\n");
          stepFiltered = true;
        } else {
          stepFiltered = false;
        }
      }

      return {
        taskName: "", // Could be extracted from taskRunName or fetched separately if needed
        taskRunName,
        logs: logs || "No logs available for this TaskRun",
        hasLogs: logParts.length > 0,
        error: null,
        stepFiltered,
      } satisfies TektonResultTaskLogs;
    } catch (error) {
      return {
        taskName: "",
        taskRunName,
        logs: "",
        hasLogs: false,
        error: error instanceof Error ? error.message : "Unknown error",
        stepFiltered: undefined,
      } satisfies TektonResultTaskLogs;
    }
  });
