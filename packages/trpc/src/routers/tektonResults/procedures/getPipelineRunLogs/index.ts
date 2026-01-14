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
function formatTaskHeader(taskName: string, taskRunName: string, hasLogs: boolean): string {
  const icon = hasLogs ? "▶" : "○";
  const headerLine = `${ANSI.primary}${ANSI.bold}${icon} Task: ${taskName}${ANSI.reset}`;
  const subLine = `${ANSI.muted}  └─ TaskRun: ${taskRunName}${ANSI.reset}`;
  return `\n${headerLine}\n${subLine}\n`;
}

function formatTaskSeparator(): string {
  return `${ANSI.border}${ANSI.dim}${"─".repeat(60)}${ANSI.reset}\n`;
}

function formatErrorMessage(message: string): string {
  return `${ANSI.destructive}  ✗ ${message}${ANSI.reset}\n`;
}

function formatInfoMessage(message: string): string {
  return `${ANSI.amber}  ℹ ${message}${ANSI.reset}\n`;
}

/**
 * Helper to format log content lines with task name prefix
 */
function formatLogContent(taskName: string, logContent: string): string[] {
  const parts: string[] = [];
  const lines = logContent.split("\n");

  for (const line of lines) {
    if (line.trim()) {
      parts.push(`[${taskName}]  ${line}\n`);
    } else {
      parts.push("\n");
    }
  }

  return parts;
}

/**
 * Helper to process logs for a single TaskRun
 * Fetches and formats all log records for the given TaskRun
 */
async function processTaskRunLogs(
  client: ReturnType<typeof createTektonResultsClient>,
  taskName: string,
  taskRunName: string,
  resultUid: string
): Promise<string[]> {
  const parts: string[] = [];

  // List log records for this TaskRun
  const logsResponse = await client.listRecords(resultUid, {
    filter: `data_type == 'results.tekton.dev/v1alpha3.Log' && data.spec.resource.name == '${taskRunName}'`,
    pageSize: 10,
  });

  if (logsResponse.records.length === 0) {
    parts.push(formatTaskHeader(taskName, taskRunName, false));
    parts.push(formatInfoMessage("No logs available"));
    return parts;
  }

  for (const logRecord of logsResponse.records) {
    const decoded = decodeTektonRecordData<DecodedLogRecord>(logRecord.data.value);
    const status = decoded.status || {};

    if (!status.isStored || status.size === 0) {
      parts.push(formatTaskHeader(taskName, taskRunName, false));
      parts.push(formatInfoMessage(status.errorOnStoreMsg || "Log content not stored"));
      continue;
    }

    const parsed = parseRecordName(logRecord.name);
    if (!parsed) continue;

    const logContent = await client.getLogContent(parsed.resultUid, parsed.recordUid);

    parts.push(formatTaskHeader(taskName, taskRunName, true));
    parts.push(formatTaskSeparator());
    parts.push(...formatLogContent(taskName, logContent));
  }

  return parts;
}

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
  .query(async ({ input }): Promise<{ logs: string }> => {
    const { namespace, resultUid, recordUid } = input;
    const client = createTektonResultsClient(namespace);

    // Get PipelineRun record to extract TaskRuns
    const pipelineRunRecord = await client.getRecord(resultUid, recordUid);
    const pipelineRun = decodeTektonRecordData<DecodedPipelineRun>(pipelineRunRecord.data.value);

    const childRefs = pipelineRun.status?.childReferences || [];
    const logParts: string[] = [];

    // Fetch logs for each TaskRun
    for (const childRef of childRefs) {
      try {
        const taskLogs = await processTaskRunLogs(client, childRef.pipelineTaskName, childRef.name, resultUid);
        logParts.push(...taskLogs);
      } catch (error) {
        // Handle errors for individual TaskRuns
        logParts.push(formatTaskHeader(childRef.pipelineTaskName, childRef.name, false));
        logParts.push(formatErrorMessage(error instanceof Error ? error.message : "Unknown error"));
      }
    }

    return {
      logs: logParts.join("") || "No logs available for this PipelineRun",
    };
  });
