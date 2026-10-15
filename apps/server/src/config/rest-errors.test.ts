import { describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import type { FastifyReply, FastifyRequest } from "fastify";
import { STATUS_CODES } from "node:http";
import {
  HttpCancelledError,
  HttpNetworkError,
  HttpNotConfiguredError,
  HttpStatusError,
  HttpTimeoutError,
  REST_ERROR_REASONS,
} from "@my-project/trpc";
import { restErrorResponse, sendRestError } from "./rest-errors.js";

// Planted in every upstream-derived field. Must never reach a response body.
const SENTINEL = "SENTINEL-LEAK";

function statusError(status: number): HttpStatusError {
  return new HttpStatusError({
    service: "Dependency-Track",
    url: `https://${SENTINEL}/api/v1/project`,
    status,
    statusText: SENTINEL,
    body: `{"detail":"${SENTINEL}"}`,
  });
}

/** Mirrors tRPC wrapping a thrown non-TRPCError inside a procedure. */
function wrapped(
  cause: unknown,
  code: TRPCError["code"] = "INTERNAL_SERVER_ERROR"
): TRPCError {
  return new TRPCError({ code, message: SENTINEL, cause });
}

describe("restErrorResponse — upstream failures", () => {
  it.each([401, 403, 429, 500, 502, 503])(
    "maps an upstream %i to 502 BAD_GATEWAY with a static body",
    (status) => {
      const result = restErrorResponse(wrapped(statusError(status)));

      expect(result).toMatchObject({
        status: 502,
        body: { error: { code: "BAD_GATEWAY", message: "Bad Gateway" } },
      });
    }
  );

  it("finds the HttpError two wrappers deep", () => {
    const error = wrapped(wrapped(statusError(500)));

    expect(restErrorResponse(error)?.status).toBe(502);
  });

  it("accepts an unwrapped HttpError", () => {
    expect(restErrorResponse(statusError(500))?.status).toBe(502);
  });

  it("maps a network failure to 503", () => {
    const error = wrapped(
      new HttpNetworkError("Dependency-Track", {
        cause: new TypeError("fetch failed"),
      })
    );

    expect(restErrorResponse(error)).toMatchObject({
      status: 503,
      body: {
        error: { code: "SERVICE_UNAVAILABLE", message: "Service Unavailable" },
      },
    });
  });

  it("maps a timeout to 504", () => {
    const error = wrapped(
      new HttpTimeoutError("Dependency-Track", 30_000, true)
    );

    expect(restErrorResponse(error)).toMatchObject({
      status: 504,
      body: { error: { code: "GATEWAY_TIMEOUT", message: "Gateway Timeout" } },
    });
  });

  it("maps not-configured to 503 naming the service", () => {
    const error = wrapped(new HttpNotConfiguredError("Dependency-Track"));

    expect(restErrorResponse(error)).toMatchObject({
      status: 503,
      body: {
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Dependency-Track integration is not configured",
        },
      },
    });
  });

  it("maps not-configured for an unknown service to a generic 503 and logs it", () => {
    const error = wrapped(new HttpNotConfiguredError(SENTINEL));

    expect(restErrorResponse(error)).toEqual({
      status: 503,
      body: {
        error: { code: "SERVICE_UNAVAILABLE", message: "Service Unavailable" },
      },
      shouldLog: true,
    });
  });

  it("logs upstream failures but not tRPC client errors", () => {
    expect(restErrorResponse(wrapped(statusError(500))).shouldLog).toBe(true);
    expect(
      restErrorResponse(new TRPCError({ code: "NOT_FOUND" })).shouldLog
    ).toBe(false);
  });

  it.each([
    ["NOT_FOUND", 404],
    ["FORBIDDEN", 403],
    ["CONFLICT", 409],
    ["TOO_MANY_REQUESTS", 429],
  ] as const)(
    "keeps an explicit %s chosen by the procedure over the upstream status",
    (code, status) => {
      const result = restErrorResponse(wrapped(statusError(500), code));

      expect(result).toEqual({
        status,
        body: { error: { code, message: STATUS_CODES[status] } },
        shouldLog: false,
      });
    }
  );

  it("maps a handler abort on req.signal to 499 without logging", () => {
    const error = new DOMException("fetchAllComponents aborted", "AbortError");
    expect(restErrorResponse(error)).toEqual({
      status: 499,
      body: {
        error: {
          code: "CLIENT_CLOSED_REQUEST",
          message: "Client Closed Request",
        },
      },
      shouldLog: false,
    });
  });

  it("gives a bare CLIENT_CLOSED_REQUEST the same phrase as a cancelled upstream call", () => {
    const bare = restErrorResponse(
      new TRPCError({ code: "CLIENT_CLOSED_REQUEST" })
    );
    const cancelled = restErrorResponse(
      wrapped(
        new HttpCancelledError("Dependency-Track"),
        "CLIENT_CLOSED_REQUEST"
      )
    );
    expect(bare.status).toBe(499);
    expect(bare.body).toEqual(cancelled.body);
    expect(bare.body.error.message).toBe("Client Closed Request");
  });

  it("maps a timeout to 504 even when the procedure coded it TIMEOUT", () => {
    const error = wrapped(new HttpTimeoutError("x", 1, true), "TIMEOUT");

    expect(restErrorResponse(error).status).toBe(504);
  });

  it("maps an upstream 404 the procedure did not translate to 502", () => {
    expect(restErrorResponse(wrapped(statusError(404)))?.status).toBe(502);
  });

  it.each(["CLIENT_CLOSED_REQUEST", "INTERNAL_SERVER_ERROR"] as const)(
    "maps a cancelled request wrapped as %s to 499",
    (code) => {
      const error = wrapped(new HttpCancelledError("Dependency-Track"), code);

      expect(restErrorResponse(error)).toMatchObject({
        status: 499,
        body: {
          error: {
            code: "CLIENT_CLOSED_REQUEST",
            message: "Client Closed Request",
          },
        },
      });
    }
  );

  it.each([
    ["status", wrapped(statusError(500))],
    ["network", wrapped(new HttpNetworkError("x"))],
    ["timeout", wrapped(new HttpTimeoutError("x", 1, true))],
    ["not configured", wrapped(new HttpNotConfiguredError("x"))],
  ])("never copies upstream detail into the %s body", (_name, error) => {
    expect(JSON.stringify(restErrorResponse(error)?.body)).not.toContain(
      SENTINEL
    );
  });
});

describe("restErrorResponse — tRPC errors", () => {
  it("keeps tRPC's status and code with the static phrase", () => {
    const error = new TRPCError({ code: "UNAUTHORIZED", message: SENTINEL });

    expect(restErrorResponse(error)).toEqual({
      status: 401,
      body: { error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
      shouldLog: false,
    });
  });

  it("passes a public reason tag through", () => {
    const error = new TRPCError({
      code: "NOT_FOUND",
      message: SENTINEL,
      cause: { reason: "codebase_not_found" },
    });

    expect(restErrorResponse(error)?.body).toEqual({
      error: {
        code: "NOT_FOUND",
        reason: "codebase_not_found",
        message: "Not Found",
      },
    });
  });

  it("ignores a non-string cause.reason", () => {
    const error = new TRPCError({
      code: "NOT_FOUND",
      message: SENTINEL,
      cause: { reason: 42 },
    });

    expect(restErrorResponse(error)?.body.error).not.toHaveProperty("reason");
  });

  it("keeps a reason tag on INTERNAL_SERVER_ERROR", () => {
    const error = new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      cause: { reason: "list_truncated" },
    });

    expect(restErrorResponse(error).body.error).toEqual({
      code: "INTERNAL_SERVER_ERROR",
      reason: "list_truncated",
      message: "Internal Server Error",
    });
  });

  it("maps a plain Error wrapped by tRPC to 500", () => {
    expect(restErrorResponse(wrapped(new Error(SENTINEL)))).toEqual({
      status: 500,
      body: {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal Server Error",
        },
      },
      shouldLog: true,
    });
  });

  it.each(REST_ERROR_REASONS)("keeps the public reason %s", (reason) => {
    const error = new TRPCError({
      code: "BAD_REQUEST",
      message: SENTINEL,
      cause: { source: "validation", reason },
    });

    expect(restErrorResponse(error).body).toEqual({
      error: { code: "BAD_REQUEST", reason, message: "Bad Request" },
    });
  });

  it.each([
    ["a plain cause", { reason: SENTINEL }],
    [
      "a K8s ApiException-shaped cause",
      {
        kind: "Status",
        status: "Failure",
        message: SENTINEL,
        reason: SENTINEL,
        code: 404,
        source: "k8s",
      },
    ],
    [
      "an upstream-response-shaped cause",
      {
        source: "k8s",
        statusCode: 404,
        statusText: SENTINEL,
        responseBody: `{"reason":"${SENTINEL}"}`,
        reason: SENTINEL,
      },
    ],
    ["a K8s StatusReason", { source: "k8s", reason: "NotFound" }],
  ])("drops a reason outside the public list from %s", (_name, cause) => {
    for (const code of ["NOT_FOUND", "INTERNAL_SERVER_ERROR"] as const) {
      const body = restErrorResponse(
        new TRPCError({ code, message: SENTINEL, cause })
      ).body;

      expect(body.error).not.toHaveProperty("reason");
      expect(JSON.stringify(body)).not.toContain(SENTINEL);
    }
  });

  it("maps an unknown tRPC code to a static 500", () => {
    const error = new TRPCError({ code: "NOT_FOUND", message: SENTINEL });
    Object.defineProperty(error, "code", { value: SENTINEL });

    expect(restErrorResponse(error)).toEqual({
      status: 500,
      body: {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal Server Error",
        },
      },
      shouldLog: true,
    });
  });
});

describe("restErrorResponse — unmapped input", () => {
  it.each([new Error(SENTINEL), undefined, null, SENTINEL, { reason: "x" }])(
    "answers a static 500 for %j",
    (input) => {
      expect(restErrorResponse(input)).toEqual({
        status: 500,
        body: {
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "Internal Server Error",
          },
        },
        shouldLog: true,
      });
    }
  );
});

describe("sendRestError", () => {
  function stubs() {
    const res = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
    const req = { log: { error: vi.fn(), warn: vi.fn() } };
    return {
      res,
      req,
      call: (error: unknown) =>
        sendRestError(
          error,
          req as unknown as FastifyRequest,
          res as unknown as FastifyReply
        ),
    };
  }

  it("sends the mapped envelope, returns the reply and logs upstream failures", () => {
    const { res, req, call } = stubs();
    const error = wrapped(statusError(500));

    expect(call(error)).toBe(res);
    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.send).toHaveBeenCalledWith({
      error: { code: "BAD_GATEWAY", message: "Bad Gateway" },
    });
    expect(req.log.error).toHaveBeenCalledWith(
      expect.objectContaining({ err: error }),
      "request failed"
    );
  });

  it.each([
    ["a plain Error", new Error("boom")],
    ["a wrapped Error", wrapped(new Error("boom"))],
    [
      "a bare INTERNAL_SERVER_ERROR",
      new TRPCError({ code: "INTERNAL_SERVER_ERROR" }),
    ],
  ])("sends a static 500 and logs %s", (_name, error) => {
    const { res, req, call } = stubs();

    call(error);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(req.log.error).toHaveBeenCalledWith(
      expect.objectContaining({ err: error }),
      "request failed"
    );
  });

  it("does not log tRPC client errors", () => {
    const { res, req, call } = stubs();

    call(new TRPCError({ code: "NOT_FOUND" }));

    expect(res.status).toHaveBeenCalledWith(404);
    expect(req.log.error).not.toHaveBeenCalled();
  });

  it("does not log a not-configured integration", () => {
    const { res, req, call } = stubs();

    call(wrapped(new HttpNotConfiguredError("SonarQube")));

    expect(res.status).toHaveBeenCalledWith(503);
    expect(req.log.error).not.toHaveBeenCalled();
  });

  it("warns about an unregistered reason and leaves it out of the body", () => {
    const { res, req, call } = stubs();

    call(
      new TRPCError({
        code: "CONFLICT",
        cause: { source: "validation", reason: "new_tag" },
      })
    );

    expect(res.send).toHaveBeenCalledWith({
      error: { code: "CONFLICT", message: "Conflict" },
    });
    expect(req.log.warn).toHaveBeenCalledWith(
      { reason: "new_tag" },
      expect.any(String)
    );
  });

  it.each([
    ["a public reason", { reason: "build_in_progress" }],
    ["a non-string reason", { reason: 42 }],
    ["no reason", { source: "k8s" }],
  ])("does not warn for %s", (_name, cause) => {
    const { req, call } = stubs();

    call(new TRPCError({ code: "CONFLICT", cause }));

    expect(req.log.warn).not.toHaveBeenCalled();
  });
});
