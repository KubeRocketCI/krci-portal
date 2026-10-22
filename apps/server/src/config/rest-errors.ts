// Error envelope for the hand-written `/rest/*` routes in `openapi.ts`.

import {
  findHttpError,
  HttpCancelledError,
  HttpNetworkError,
  HttpNotConfiguredError,
  HttpStatusError,
  HttpTimeoutError,
  httpStatusPhrase,
  notConfiguredMessage,
  toIntegration,
  toRestErrorReason,
  type RestErrorReason,
} from "@my-project/trpc";
import { TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import {
  TRPC_ERROR_CODES_BY_KEY,
  type TRPC_ERROR_CODE_KEY,
} from "@trpc/server/rpc";
import type { FastifyReply, FastifyRequest } from "fastify";

export interface RestErrorBody {
  error: { code: string; reason?: RestErrorReason; message: string };
}

export interface RestErrorResponse {
  status: number;
  body: RestErrorBody;
  /** Log the original error server-side. */
  shouldLog: boolean;
}

const TRPC_CODES = Object.keys(
  TRPC_ERROR_CODES_BY_KEY
) as TRPC_ERROR_CODE_KEY[];

/**
 * Map an error thrown by a proxied procedure to the REST envelope.
 *
 * Order:
 * 1. A transport failure on the cause chain: not configured → 503,
 *    unreachable → 503, timeout → 504, cancelled by the caller → 499.
 *    An `AbortError` raised by a handler on `req.signal` is also 499.
 * 2. A `TRPCError` with any code other than INTERNAL_SERVER_ERROR keeps
 *    tRPC's status and code, plus a `reason` tag when the cause carries one.
 *    This includes a procedure's own translation of an upstream status.
 * 3. An untranslated upstream error response → 502.
 * 4. Any other error → 500, keeping a `reason` tag from a `TRPCError` cause.
 *
 * Every body field is a constant: `code` from tRPC's code list, `reason` from
 * `REST_ERROR_REASONS`, `message` from the status phrase or `INTEGRATIONS`.
 * Values outside those lists are dropped. No error data is copied.
 * Every 5xx is logged, except a known integration that is not configured.
 */
export function restErrorResponse(error: unknown): RestErrorResponse {
  const upstream = findHttpError(error);

  if (upstream instanceof HttpNotConfiguredError) {
    const service = toIntegration(upstream.service);
    return envelope(503, "SERVICE_UNAVAILABLE", {
      message: service && notConfiguredMessage(service),
      shouldLog: !service,
    });
  }
  if (upstream instanceof HttpNetworkError) {
    return envelope(503, "SERVICE_UNAVAILABLE");
  }
  if (upstream instanceof HttpTimeoutError) {
    return envelope(504, "GATEWAY_TIMEOUT");
  }
  if (upstream instanceof HttpCancelledError) {
    return envelope(499, "CLIENT_CLOSED_REQUEST");
  }
  if (isAbortError(error)) {
    return envelope(499, "CLIENT_CLOSED_REQUEST");
  }

  if (error instanceof TRPCError && error.code !== "INTERNAL_SERVER_ERROR") {
    return envelope(
      getHTTPStatusCodeFromError(error),
      toPublicCode(error.code),
      {
        reason: extractCauseReason(error.cause),
      }
    );
  }

  if (upstream instanceof HttpStatusError) {
    return envelope(502, "BAD_GATEWAY");
  }

  return envelope(500, "INTERNAL_SERVER_ERROR", {
    reason:
      error instanceof TRPCError ? extractCauseReason(error.cause) : undefined,
  });
}

/**
 * Send the mapped envelope and end the request. Returns the reply so handlers
 * can `return` it. The original error goes to the server log only.
 *
 * A string `cause.reason` outside `REST_ERROR_REASONS` is logged at warn:
 * register it if it is public API.
 */
export function sendRestError(
  error: unknown,
  req: FastifyRequest,
  res: FastifyReply
): FastifyReply {
  const mapped = restErrorResponse(error);

  if (mapped.shouldLog) {
    req.log.error({ err: error }, "request failed");
  }

  const dropped = unregisteredCauseReason(error);
  if (dropped !== undefined) {
    req.log.warn(
      { reason: dropped },
      "error reason not in REST_ERROR_REASONS; dropped from the response"
    );
  }

  return res.status(mapped.status).send(mapped.body);
}

function envelope(
  status: number,
  code: string,
  extra: {
    reason?: RestErrorReason;
    message?: string;
    shouldLog?: boolean;
  } = {}
): RestErrorResponse {
  const message = extra.message ?? httpStatusPhrase(status);
  return {
    status,
    body: {
      error: extra.reason
        ? { code, reason: extra.reason, message }
        : { code, message },
    },
    shouldLog: extra.shouldLog ?? status >= 500,
  };
}

/** Unknown codes collapse to INTERNAL_SERVER_ERROR. */
function toPublicCode(code: unknown): TRPC_ERROR_CODE_KEY {
  return TRPC_CODES.find((known) => known === code) ?? "INTERNAL_SERVER_ERROR";
}

/** Structural: a `DOMException` from another realm fails `instanceof Error`. */
function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { name?: unknown }).name === "AbortError"
  );
}

function rawCauseReason(cause: unknown): unknown {
  if (typeof cause !== "object" || cause === null) return undefined;
  return (cause as { reason?: unknown }).reason;
}

function extractCauseReason(cause: unknown): RestErrorReason | undefined {
  return toRestErrorReason(rawCauseReason(cause));
}

function unregisteredCauseReason(error: unknown): string | undefined {
  if (!(error instanceof TRPCError)) return undefined;
  const raw = rawCauseReason(error.cause);
  return typeof raw === "string" && toRestErrorReason(raw) === undefined
    ? raw
    : undefined;
}
