import { STATUS_CODES } from "node:http";
import { TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import type { OpenAPIObject } from "trpc-to-openapi";

const ERROR_SCHEMA_PREFIX = "error.";

/**
 * Fallback `error.message` when an HTTP status has no canonical phrase.
 * Imported by `handleTRPCError` so the wire payload and the OpenAPI example
 * never drift.
 */
export const UNKNOWN_ERROR_PHRASE = "Unknown error";

const ENVELOPE_DESCRIPTION =
  "REST error envelope emitted by handleTRPCError. `message` is the static HTTP " +
  "status phrase; `reason` (when present) is a stable machine-readable disambiguator " +
  "that consumers should key off rather than parsing the human message.";

const REASON_PROPERTY_SCHEMA = {
  type: "string",
  description: "Stable machine-readable disambiguator (omitted when none applies)",
} as const;

/**
 * Rewrites every `error.<CODE>` schema in an OpenAPI document so it describes
 * the REST envelope that `handleTRPCError` (apps/server/src/config/openapi.ts)
 * actually emits:
 *
 *   { error: { code, reason?, message } }
 *
 * trpc-to-openapi's default output documents tRPC's native error JSON
 * ({code, message, issues[]}), which is NOT what the Fastify adapter sends on
 * the wire. Calling this rewriter brings the doc in line with what REST
 * consumers (e.g. the Go CLI) actually receive, so generated client types are
 * accurate and key off `error.reason` rather than hand-parsing.
 *
 * Schema names (`error.BAD_REQUEST`, `error.NOT_FOUND`, ...) are preserved so
 * existing path `$ref` entries in the generated doc remain valid; only the
 * schema bodies change.
 */
export function rewriteErrorEnvelopeSchemas(doc: OpenAPIObject): void {
  const schemas = doc.components?.schemas;
  if (!schemas) return;

  for (const name of Object.keys(schemas)) {
    if (!name.startsWith(ERROR_SCHEMA_PREFIX)) continue;

    const trpcCode = name.slice(ERROR_SCHEMA_PREFIX.length);
    // Derive status/phrase exactly as handleTRPCError does
    // (apps/server/src/config/openapi.ts) so example.message matches the wire.
    // The cast is safe at runtime: getHTTPStatusCodeFromError falls back to 500
    // for any code not in TRPC_ERROR_CODES_BY_KEY.
    const httpStatus = getHTTPStatusCodeFromError(new TRPCError({ code: trpcCode as TRPCError["code"] }));
    const phrase = STATUS_CODES[httpStatus] ?? UNKNOWN_ERROR_PHRASE;

    schemas[name] = {
      type: "object",
      title: `${trpcCode} error envelope (${httpStatus})`,
      description: ENVELOPE_DESCRIPTION,
      required: ["error"],
      properties: {
        error: {
          type: "object",
          required: ["code", "message"],
          properties: {
            code: {
              type: "string",
              description: "tRPC error code (string literal)",
              example: trpcCode,
            },
            reason: REASON_PROPERTY_SCHEMA,
            message: {
              type: "string",
              description: "Static HTTP status phrase",
              example: phrase,
            },
          },
        },
      },
      example: {
        error: { code: trpcCode, message: phrase },
      },
    };
  }
}
