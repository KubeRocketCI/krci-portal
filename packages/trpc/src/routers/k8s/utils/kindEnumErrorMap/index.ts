import type { z } from "zod";

/**
 * Builds a Zod errorMap that reports the allowed kind list when the provided
 * kind is not in the workload-action allowlist. Use with `z.enum(KIND_TUPLE, { errorMap: kindEnumErrorMap(KIND_TUPLE) })`
 * so the validation message points operators at the supported kinds.
 */
export function kindEnumErrorMap(allowedKinds: readonly string[]): z.ZodErrorMap {
  return () => ({
    message: `resourceConfig.kind must be one of: ${allowedKinds.join(", ")}`,
  });
}
