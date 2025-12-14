import { z } from "zod";
import { decodeTektonRecordData, parseRecordName, DecodedPipelineRun, DecodedLogRecord } from "@my-project/shared";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { createTektonResultsClient } from "../../../../clients/tektonResults/index.js";

// ANSI escape codes for terminal styling (supported by xterm.js)
const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  gray: "\x1b[90m",
};

// Helper to create styled task headers
const formatTaskHeader = (taskName: string, taskRunName: string, hasLogs: boolean) => {
  const icon = hasLogs ? "▶" : "○";
  const headerLine = `${ANSI.cyan}${ANSI.bold}${icon} Task: ${taskName}${ANSI.reset}`;
  const subLine = `${ANSI.gray}  └─ TaskRun: ${taskRunName}${ANSI.reset}`;
  return `\n${headerLine}\n${subLine}\n`;
};

const formatTaskSeparator = () => {
  return `${ANSI.dim}${"─".repeat(60)}${ANSI.reset}\n`;
};

const formatErrorMessage = (message: string) => {
  return `${ANSI.red}  ✗ ${message}${ANSI.reset}\n`;
};

const formatInfoMessage = (message: string) => {
  return `${ANSI.yellow}  ℹ ${message}${ANSI.reset}\n`;
};

/**
 * Get formatted logs for a PipelineRun from Tekton Results
 * Returns all TaskRun logs with [task-name] prefixes for easy reading
 */
export const getPipelineRunLogsProcedure = protectedProcedure
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

    // Get PipelineRun record to extract TaskRuns
    const pipelineRunRecord = await client.getRecord(resultUid, recordUid);
    const pipelineRun = decodeTektonRecordData<DecodedPipelineRun>(pipelineRunRecord.data.value);

    const childRefs = pipelineRun.status?.childReferences || [];
    const logParts: string[] = [];

    // Fetch logs for each TaskRun
    for (const childRef of childRefs) {
      const taskRunName = childRef.name;
      const taskName = childRef.pipelineTaskName;

      try {
        // List log records for this TaskRun
        const logsResponse = await client.listRecords(resultUid, {
          filter: `data_type == 'results.tekton.dev/v1alpha3.Log' && data.spec.resource.name == '${taskRunName}'`,
          pageSize: 10,
        });

        if (logsResponse.records.length === 0) {
          logParts.push(formatTaskHeader(taskName, taskRunName, false));
          logParts.push(formatInfoMessage("No logs available"));
          continue;
        }

        for (const logRecord of logsResponse.records) {
          const decoded = decodeTektonRecordData<DecodedLogRecord>(logRecord.data.value);
          const status = decoded.status || {};

          if (!status.isStored || status.size === 0) {
            logParts.push(formatTaskHeader(taskName, taskRunName, false));
            logParts.push(formatInfoMessage(status.errorOnStoreMsg || "Log content not stored"));
            continue;
          }

          // Parse record name to get log_uid
          const parsed = parseRecordName(logRecord.name);
          if (!parsed) continue;

          // Fetch actual log content
          const logContent = await client.getLogContent(parsed.resultUid, parsed.recordUid);

          // Add task header
          logParts.push(formatTaskHeader(taskName, taskRunName, true));
          logParts.push(formatTaskSeparator());

          // Add log content with [task-name] prefix on each line
          const lines = logContent.split("\n");
          for (const line of lines) {
            if (line.trim()) {
              logParts.push(`[${taskName}]  ${line}\n`);
            } else {
              logParts.push("\n");
            }
          }
        }
      } catch (error) {
        // Handle errors for individual TaskRuns
        logParts.push(formatTaskHeader(taskName, taskRunName, false));
        logParts.push(formatErrorMessage(error instanceof Error ? error.message : "Unknown error"));
      }
    }

    return {
      logs: logParts.join("") || "No logs available for this PipelineRun",
    };
  });
