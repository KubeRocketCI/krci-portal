import { TRPCError } from "@trpc/server";
import type { TRPC_ERROR_CODE_KEY } from "@trpc/server/rpc";
import { stripTrailingSlash } from "@my-project/shared";
import type { ZodType } from "zod";

/**
 * Upstream HTTP status → tRPC code.
 *
 * 401 → FORBIDDEN (not UNAUTHORIZED): UNAUTHORIZED triggers the portal login redirect, and an
 * upstream auth failure is a downstream issue, not an expired portal session.
 * Anything absent here is INTERNAL_SERVER_ERROR.
 */
const STATUS_TO_TRPC_CODE: Record<number, TRPC_ERROR_CODE_KEY> = {
  400: "BAD_REQUEST",
  401: "FORBIDDEN",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  408: "TIMEOUT",
  409: "CONFLICT",
  429: "TOO_MANY_REQUESTS",
};

/**
 * Base for every failure the transport itself raises.
 *
 * A response-schema failure is deliberately NOT in this family: it means the request succeeded and
 * the body did not match, so it must reach the caller as the original `ZodError`. Handlers that
 * translate transport failures must match this family positively, never catch-all.
 */
export abstract class HttpError extends Error {
  readonly service: string;

  protected constructor(service: string, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
    this.service = service;
  }
}

export interface HttpStatusErrorInit {
  service: string;
  url: string;
  status: number;
  statusText: string;
  body: string;
}

/**
 * A non-2xx response from an external service.
 *
 * Branch on `status`, never on `message`. The response body is kept in `body` and logged
 * server-side; it is never put in `message`, which tRPC forwards verbatim to the browser.
 */
export class HttpStatusError extends HttpError {
  readonly url: string;
  readonly status: number;
  readonly statusText: string;
  readonly body: string;

  constructor(init: HttpStatusErrorInit, options?: ErrorOptions) {
    super(init.service, `${init.service} request failed: ${init.status} ${init.statusText}`, options);
    this.url = init.url;
    this.status = init.status;
    this.statusText = init.statusText;
    this.body = init.body;
  }
}

/** A deadline expired: either this service's own `timeoutMs` or a caller-supplied budget. */
export class HttpTimeoutError extends HttpError {
  readonly timeoutMs: number;

  constructor(service: string, timeoutMs: number, ownTimeout: boolean, options?: ErrorOptions) {
    super(service, `${service} request timed out${ownTimeout ? ` after ${timeoutMs}ms` : ""}`, options);
    this.timeoutMs = timeoutMs;
  }
}

/** The caller aborted for a reason other than a deadline, such as a client disconnect. */
export class HttpCancelledError extends HttpError {
  constructor(service: string, options?: ErrorOptions) {
    super(service, `${service} request was cancelled by the caller`, options);
  }
}

/**
 * Rethrow transport failures as `TRPCError`s carrying an upstream-derived code.
 *
 * Opt in only for services whose procedures do not catch, so the upstream status reaches the
 * browser as a tRPC code. Everything that is not an `HttpError` — a `ZodError` from `schema`, a
 * network `TypeError` — passes through untouched.
 */
export function withTRPCErrors(http: HttpService): HttpService {
  return {
    json: (path, opts) => http.json(path, opts).catch(rethrowAsTRPCError),
    jsonWithHeaders: (path, opts) => http.jsonWithHeaders(path, opts).catch(rethrowAsTRPCError),
    text: (path, opts) => http.text(path, opts).catch(rethrowAsTRPCError),
  };
}

function rethrowAsTRPCError(error: unknown): never {
  if (error instanceof HttpStatusError) {
    throw new TRPCError({
      code: STATUS_TO_TRPC_CODE[error.status] ?? "INTERNAL_SERVER_ERROR",
      message: error.message,
      cause: error,
    });
  }

  if (error instanceof HttpTimeoutError) {
    throw new TRPCError({ code: "TIMEOUT", message: error.message, cause: error });
  }

  if (error instanceof HttpCancelledError) {
    throw new TRPCError({ code: "CLIENT_CLOSED_REQUEST", message: error.message, cause: error });
  }

  throw error;
}

export interface HttpServiceConfig {
  /** Prefixes error messages and log lines. */
  name: string;
  /** Trailing slashes are stripped here; callers pass paths beginning with "/". */
  baseURL: string;
  timeoutMs: number;
  /** Sent on every request. May override the default `Accept`. */
  headers?: Record<string, string>;
}

export interface RequestOptions {
  /** `undefined`, `null` and `""` values are dropped; everything else is stringified. */
  query?: Record<string, unknown>;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: BodyInit;
  /** Caller cancellation (for example `req.signal`), raced against the timeout. */
  signal?: AbortSignal;
}

export interface JsonRequestOptions<T> extends RequestOptions {
  /** Validates the decoded body. Without it the body is cast, not checked. */
  schema?: ZodType<T>;
}

/**
 * Transport for an external JSON API.
 *
 * Error modes:
 * - non-2xx → `HttpStatusError`
 * - deadline expired → `HttpTimeoutError`
 * - caller aborted → `HttpCancelledError`
 * - `schema` mismatch → the `ZodError`, unwrapped
 *
 * All four are framework-neutral. Wrap with `withTRPCErrors` for services whose procedures pass
 * the upstream status through to the browser as a tRPC code.
 */
export interface HttpService {
  json<T>(path: string, opts?: JsonRequestOptions<T>): Promise<T>;
  /** For responses whose headers carry data, such as a pagination total. */
  jsonWithHeaders<T>(path: string, opts?: JsonRequestOptions<T>): Promise<{ data: T; headers: Headers }>;
  text(path: string, opts?: RequestOptions): Promise<string>;
}

export function createHttpService(config: HttpServiceConfig): HttpService {
  const { name, timeoutMs } = config;
  const baseURL = stripTrailingSlash(config.baseURL);

  if (!baseURL) {
    throw new Error(`${name} base URL is not configured`);
  }

  async function send<R>(
    path: string,
    accept: string,
    opts: RequestOptions,
    read: (response: Response) => Promise<R>
  ): Promise<R> {
    const url = `${baseURL}${appendQuery(path, opts.query)}`;
    // AbortSignal.any resolves whichever fires first; `timeoutSignal.aborted` then tells the two
    // causes apart. Requires Node >= 20.3.
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const signal = opts.signal ? AbortSignal.any([timeoutSignal, opts.signal]) : timeoutSignal;

    try {
      const response = await fetch(url, {
        method: opts.method ?? "GET",
        headers: { Accept: accept, ...config.headers },
        body: opts.body,
        signal,
      });

      if (!response.ok) {
        throw await buildStatusError(name, url, response);
      }

      return await read(response);
    } catch (error) {
      if (error instanceof HttpError || !isAbortError(error)) {
        throw error;
      }

      // AbortSignal.any adopts the winning signal's reason. A deadline aborts with a TimeoutError,
      // whether it is our timer or a caller-supplied budget; only a real disconnect aborts with an
      // AbortError. Classify on the reason, not on which signal fired, and default to timeout so
      // an unattributable abort is never reported as a disconnect.
      if (abortReasonName(signal) === "AbortError") {
        throw new HttpCancelledError(name, { cause: error });
      }

      throw new HttpTimeoutError(name, timeoutMs, timeoutSignal.aborted, { cause: error });
    }
  }

  return {
    json<T>(path: string, opts: JsonRequestOptions<T> = {}): Promise<T> {
      return send(path, "application/json", opts, (response) => decodeJson<T>(response, opts.schema));
    },

    jsonWithHeaders<T>(path: string, opts: JsonRequestOptions<T> = {}): Promise<{ data: T; headers: Headers }> {
      return send(path, "application/json", opts, async (response) => ({
        data: await decodeJson<T>(response, opts.schema),
        headers: response.headers,
      }));
    },

    text(path: string, opts: RequestOptions = {}): Promise<string> {
      return send(path, "text/plain", opts, (response) => response.text());
    },
  };
}

async function decodeJson<T>(response: Response, schema?: ZodType<T>): Promise<T> {
  const raw: unknown = await response.json();
  return schema ? schema.parse(raw) : (raw as T);
}

function appendQuery(path: string, query?: Record<string, unknown>): string {
  if (!query) {
    return path;
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    params.append(key, String(value));
  }

  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
}

async function buildStatusError(service: string, url: string, response: Response): Promise<HttpStatusError> {
  let body = "";
  try {
    body = await response.text();
  } catch {
    body = "Unable to read error response";
  }

  console.error(`[${service}] Error - URL: ${url}`);
  console.error(`[${service}] Status: ${response.status} ${response.statusText}`);
  if (body) {
    console.error(`[${service}] Response Body: ${body}`);
  }

  return new HttpStatusError({
    service,
    url,
    status: response.status,
    statusText: response.statusText,
    body,
  });
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError");
}

function abortReasonName(signal: AbortSignal): string | undefined {
  return (signal.reason as { name?: string } | undefined)?.name;
}
