import { TRPCError } from "@trpc/server";
import { decodeTektonRecordData, TektonResultRecord } from "@my-project/shared";

/**
 * Decode an array of Tekton Result records into typed objects.
 * Throws a TRPCError with a descriptive message if any record fails to decode.
 *
 * @param records - Raw Tekton Result records with base64-encoded data
 * @param entityLabel - Human-readable label for error messages (e.g., "TaskRun", "PipelineRun")
 * @returns Array of decoded typed objects
 */
export function decodeRecords<T>(records: TektonResultRecord[], entityLabel: string): T[] {
  const decoded: T[] = [];

  for (const record of records) {
    try {
      const item = decodeTektonRecordData<T>(record.data.value);
      decoded.push(item);
    } catch (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to decode ${entityLabel} record: ${err instanceof Error ? err.message : "Unknown error"}`,
      });
    }
  }

  return decoded;
}
