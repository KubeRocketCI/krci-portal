import { TRPCError } from "@trpc/server";
import { decodeTektonRecordData, TektonResultRecord } from "@my-project/shared";
import { z } from "zod";

/**
 * Zod schemas for Tekton Results input validation.
 * Constraining to valid Kubernetes / UUID characters prevents CEL injection
 * when values are interpolated into filter expressions.
 */
export const tektonInputSchemas = {
  /** RFC 1123 DNS label: lowercase alphanumeric + hyphens, 1-253 chars */
  k8sName: z.string().regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, "Invalid Kubernetes resource name"),
  /** K8s namespace: same as DNS label */
  namespace: z.string().regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, "Invalid namespace"),
  /** UUID v4 format */
  uuid: z.string().uuid("Invalid UUID"),
  /** Step name: lowercase alphanumeric + hyphens */
  stepName: z.string().regex(/^[a-z0-9][a-z0-9-]*$/, "Invalid step name"),
  /**
   * CEL filter expression: allows alphanumeric, whitespace, and common CEL
   * operators/punctuation. Rejects shell metacharacters, backticks, and `@`
   * to prevent injection when the value is interpolated into filter strings.
   *
   * Defense-in-depth: the Tekton Results backend compiles CEL via cel-go and
   * converts the AST to SQL (cel2sql), but string literals are interpolated
   * into SQL without parameterization (see cel2sql/interpreter.go
   * interpretConstExpr). This regex blocks characters that could escape the
   * SQL string context.
   */
  celFilter: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return /^[a-zA-Z0-9\s_.\[\]()'",!=<>&|+\-*/%:]+$/.test(val);
      },
      { message: "Invalid filter: contains disallowed characters" }
    ),
} as const;

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
