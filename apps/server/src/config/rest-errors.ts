// Error envelope for the hand-written `/rest/v1/*` routes in `openapi.ts`.

import {
  findHttpError,
  HttpCancelledError,
  HttpError,
  HttpNetworkError,
  HttpNotConfiguredError,
  HttpStatusError,
  HttpTimeoutError,
  httpStatusPhrase,
} from "@my-project/trpc";
import { TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import type { FastifyReply, FastifyRequest } from "fastify";

export interface RestErrorBody {
  error: { code: string; reason?: string; message: string };
}

export interface RestErrorResponse {
  status: number;
  body: RestErrorBody;
  /** Set when the status was derived from a transport failure on the cause chain. */
  upstream?: HttpError;
}

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
 * Body fields are static per status, or per status and service name for the
 * not-configured case. No upstream request or response data is copied.
 */
export function restErrorResponse(error: unknown): RestErrorResponse {
  const upstream = findHttpError(error);

  if (upstream instanceof HttpNotConfiguredError) {
    return envelope(503, "SERVICE_UNAVAILABLE", {
      upstream,
      message: upstream.message,
    });
  }
  if (upstream instanceof HttpNetworkError) {
    return envelope(503, "SERVICE_UNAVAILABLE", { upstream });
  }
  if (upstream instanceof HttpTimeoutError) {
    return envelope(504, "GATEWAY_TIMEOUT", { upstream });
  }
  if (upstream instanceof HttpCancelledError) {
    return envelope(499, "CLIENT_CLOSED_REQUEST", { upstream });
  }
  if (isAbortError(error)) {
    return envelope(499, "CLIENT_CLOSED_REQUEST");
  }

  if (error instanceof TRPCError && error.code !== "INTERNAL_SERVER_ERROR") {
    return envelope(getHTTPStatusCodeFromError(error), error.code, {
      reason: extractCauseReason(error.cause),
    });
  }

  if (upstream instanceof HttpStatusError) {
    return envelope(502, "BAD_GATEWAY", { upstream });
  }

  return envelope(500, "INTERNAL_SERVER_ERROR", {
    reason:
      error instanceof TRPCError ? extractCauseReason(error.cause) : undefined,
  });
}

/**
 * Send the mapped envelope and end the request. Returns the reply so handlers
 * can `return` it.
 *
 * Logs every 5xx with the full cause chain, except a not-configured
 * integration. 4xx and 499 are not logged.
 */
export function sendRestError(
  error: unknown,
  req: FastifyRequest,
  res: FastifyReply
): FastifyReply {
  const mapped = restErrorResponse(error);

  const deliberate = mapped.upstream instanceof HttpNotConfiguredError;
  if (mapped.status >= 500 && !deliberate) {
    req.log.error({ err: error }, "request failed");
  }

  return res.status(mapped.status).send(mapped.body);
}

function envelope(
  status: number,
  code: string,
  extra: { upstream?: HttpError; reason?: string; message?: string } = {}
): RestErrorResponse {
  const message = extra.message ?? httpStatusPhrase(status);
  const response: RestErrorResponse = {
    status,
    body: {
      error: extra.reason
        ? { code, reason: extra.reason, message }
        : { code, message },
    },
  };
  if (extra.upstream) {
    response.upstream = extra.upstream;
  }
  return response;
}

/** Structural: a `DOMException` from another realm fails `instanceof Error`. */
function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { name?: unknown }).name === "AbortError"
  );
}

function extractCauseReason(cause: unknown): string | undefined {
  if (typeof cause !== "object" || cause === null) return undefined;
  const value = (cause as { reason?: unknown }).reason;
  return typeof value === "string" ? value : undefined;
}
