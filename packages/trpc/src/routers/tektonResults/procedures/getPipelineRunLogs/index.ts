import { z } from "zod";
import { decodeTektonRecordData, parseRecordName, DecodedPipelineRun, DecodedLogRecord } from "@my-project/shared";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { createTektonResultsClient } from "../../../../clients/tektonResults/index.js";

// ANSI escape codes for terminal styling (supported by xterm.js)
// Using 256-color palette with darker colors for better contrast on white backgrounds
// All colors are from the same intensity level for visual harmony
const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  // Primary blue - darker shade visible on white background
  primary: "\x1b[38;5;26m", // Dodger Blue 2
  // Destructive red - darker shade for errors
  destructive: "\x1b[38;5;160m", // Red 3
  // Amber/orange for info messages - darker shade
  amber: "\x1b[38;5;172m", // Orange 3
  // Muted gray for secondary text
  muted: "\x1b[38;5;238m", // Grey 27
  // Border gray for separators
  border: "\x1b[38;5;236m", // Grey 19
};

// Helper to create styled task headers
const formatTaskHeader = (taskName: string, taskRunName: string, hasLogs: boolean) => {
  const icon = hasLogs ? "▶" : "○";
  const headerLine = `${ANSI.primary}${ANSI.bold}${icon} Task: ${taskName}${ANSI.reset}`;
  const subLine = `${ANSI.muted}  └─ TaskRun: ${taskRunName}${ANSI.reset}`;
  return `\n${headerLine}\n${subLine}\n`;
};

const formatTaskSeparator = () => {
  return `${ANSI.border}${ANSI.dim}${"─".repeat(60)}${ANSI.reset}\n`;
};

const formatErrorMessage = (message: string) => {
  return `${ANSI.destructive}  ✗ ${message}${ANSI.reset}\n`;
};

const formatInfoMessage = (message: string) => {
  return `${ANSI.amber}  ℹ ${message}${ANSI.reset}\n`;
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
