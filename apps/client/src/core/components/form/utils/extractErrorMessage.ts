/**
 * Extracts a human-readable error message from TanStack Form field errors.
 *
 * Errors can be:
 * - Strings (direct error messages)
 * - Objects with a `message` property (from Zod/Standard Schema)
 * - Arrays of the above, nested when a form-level validator set them before the field mounted
 *
 * @param errors - Array of error values from TanStack Form field state
 * @returns The first error message as a string, or undefined if no error
 */
export function extractErrorMessage(errors: unknown[]): string | undefined {
  const firstError = errors.flat(Infinity)[0];

  if (typeof firstError === "string") {
    return firstError;
  }

  if (typeof firstError === "object" && firstError !== null && "message" in firstError) {
    const message = (firstError as { message: unknown }).message;
    return message != null ? String(message) : undefined;
  }

  return undefined;
}
