import { STATUS_CODES } from "node:http";
import { TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import type { generateOpenApiDocument, OpenAPIObject } from "trpc-to-openapi";
import { REST_ERROR_REASONS } from "../restErrorReason/index.js";

/** Options for `generateOpenApiDocument`. Shared by the generator script, the dev server's live document, and tests. */
export const OPENAPI_DOCUMENT_OPTIONS = {
  title: "KubeRocketCI Portal API",
  version: "1.0.0",
  baseUrl: "/rest",
  securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
      description: "OIDC idToken",
    },
  },
} satisfies Parameters<typeof generateOpenApiDocument>[1];

const ERROR_SCHEMA_PREFIX = "error.";

/**
 * Fallback `error.message` when an HTTP status has no canonical phrase.
 * Shared with `restErrorResponse` (apps/server/src/config/rest-errors.ts).
 */
export const UNKNOWN_ERROR_PHRASE = "Unknown error";

/** Envelope `message` for a status. Node has no phrase for 499. */
export function httpStatusPhrase(status: number): string {
  if (status === 499) return "Client Closed Request";
  return STATUS_CODES[status] ?? UNKNOWN_ERROR_PHRASE;
}

const ENVELOPE_DESCRIPTION =
  "REST error envelope emitted by sendRestError. `message` is static per status " +
  "(per status and integration for 503 not configured); `reason` (when present) is a public machine-readable tag " +
  "from a fixed set that consumers should key off rather than parsing the human message.";

const REASON_PROPERTY_SCHEMA = {
  type: "string",
  description:
    "Public machine-readable tag from the fixed set in `x-krci-reasons` (omitted when none applies). " +
    "Unlisted values are never sent.",
  "x-krci-reasons": [...REST_ERROR_REASONS],
} as const;

/**
 * Rewrites every `error.<CODE>` schema in an OpenAPI document so it describes
 * the REST envelope that `sendRestError` (apps/server/src/config/rest-errors.ts)
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
    // Derive status/phrase exactly as restErrorResponse does
    // (apps/server/src/config/rest-errors.ts) so example.message matches the wire.
    // The cast is safe at runtime: getHTTPStatusCodeFromError falls back to 500
    // for any code not in TRPC_ERROR_CODES_BY_KEY.
    const httpStatus = getHTTPStatusCodeFromError(new TRPCError({ code: trpcCode as TRPCError["code"] }));
    const phrase = httpStatusPhrase(httpStatus);

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
              description: "Static per status; per status and integration for 503 not configured",
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
