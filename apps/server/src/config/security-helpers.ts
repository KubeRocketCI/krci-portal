// Pure helpers for the `/rest/v1/security/*` routes. Kept in a sibling module
// so they can be unit-tested without spinning up Fastify; the routes in
// `openapi.ts` delegate to these functions.

import {
  securitySeveritySchema,
  type SecuritySeverity,
} from "@my-project/shared";

/**
 * Parses the `severity` query parameter: a comma-separated list, repeated
 * parameters, or both. Returns `undefined` when no severity is given and
 * `"invalid"` when any value is not a security severity. Case-insensitive;
 * the result has no duplicates.
 */
export function parseSecuritySeverityQuery(
  raw: string | string[] | undefined
): SecuritySeverity[] | undefined | "invalid" {
  const values = (Array.isArray(raw) ? raw : [raw])
    .flatMap((value) => (value ?? "").split(","))
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value !== "");

  if (values.length === 0) {
    return undefined;
  }

  const severities = new Set<SecuritySeverity>();
  for (const value of values) {
    const parsed = securitySeveritySchema.safeParse(value);
    if (!parsed.success) {
      return "invalid";
    }
    severities.add(parsed.data);
  }

  return [...severities];
}
