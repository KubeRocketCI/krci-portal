import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createHttpService, withTRPCErrors, HttpStatusError, HttpTimeoutError, HttpCancelledError } from "./index.js";

const BASE = "https://svc.example.com";

function makeService(overrides: Partial<Parameters<typeof createHttpService>[0]> = {}) {
  return createHttpService({ name: "TestService", baseURL: BASE, timeoutMs: 1_000, ...overrides });
}

function stubFetch(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** Rejects with an AbortError as soon as the request signal fires, like a hung upstream. */
function stubHangingFetch() {
  const fetchMock = vi.fn(
    (_url: string, init: { signal?: AbortSignal } = {}) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener("abort", () => {
          const error = new Error("aborted");
          error.name = "AbortError";
          reject(error);
        });
      })
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), { status: 200, ...init });
}

function requestedUrl(fetchMock: ReturnType<typeof vi.fn>): string {
  return String(fetchMock.mock.calls[0]?.[0]);
}

function requestInit(fetchMock: ReturnType<typeof vi.fn>): RequestInit {
  return fetchMock.mock.calls[0]?.[1] as RequestInit;
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("createHttpService", () => {
  it("throws when the base URL is empty", () => {
    expect(() => createHttpService({ name: "TestService", baseURL: "", timeoutMs: 1_000 })).toThrow(
      "TestService base URL is not configured"
    );
  });

  it("strips trailing slashes from the base URL", async () => {
    const fetchMock = stubFetch(jsonResponse({}));
    await createHttpService({ name: "TestService", baseURL: `${BASE}///`, timeoutMs: 1_000 }).json("/api/v1/things");

    expect(requestedUrl(fetchMock)).toBe(`${BASE}/api/v1/things`);
  });

  it("sends the configured headers alongside a JSON Accept header", async () => {
    const fetchMock = stubFetch(jsonResponse({}));
    await makeService({ headers: { "X-Api-Key": "secret" } }).json("/things");

    expect(requestInit(fetchMock).headers).toEqual({ Accept: "application/json", "X-Api-Key": "secret" });
  });

  it("forwards the method and body", async () => {
    const fetchMock = stubFetch(jsonResponse({}));
    await makeService().json("/things", { method: "POST", body: '{"a":1}' });

    expect(requestInit(fetchMock)).toMatchObject({ method: "POST", body: '{"a":1}' });
  });
});

describe("createHttpService query serialization", () => {
  it("omits undefined, null and empty-string values", async () => {
    const fetchMock = stubFetch(jsonResponse({}));
    await makeService().json("/things", {
      query: { keep: "yes", missing: undefined, empty: "", nulled: null },
    });

    expect(requestedUrl(fetchMock)).toBe(`${BASE}/things?keep=yes`);
  });

  it("keeps false and zero", async () => {
    const fetchMock = stubFetch(jsonResponse({}));
    await makeService().json("/things", { query: { suppressed: false, page: 0 } });

    expect(requestedUrl(fetchMock)).toBe(`${BASE}/things?suppressed=false&page=0`);
  });

  it("percent-encodes keys and values", async () => {
    const fetchMock = stubFetch(jsonResponse({}));
    await makeService().json("/things", { query: { filter: "a b&c=d" } });

    expect(requestedUrl(fetchMock)).toBe(`${BASE}/things?filter=a+b%26c%3Dd`);
  });

  it("adds no question mark when every value is dropped", async () => {
    const fetchMock = stubFetch(jsonResponse({}));
    await makeService().json("/things", { query: { missing: undefined } });

    expect(requestedUrl(fetchMock)).toBe(`${BASE}/things`);
  });
});

describe("createHttpService non-2xx responses", () => {
  it("throws an HttpStatusError carrying the status and the body", async () => {
    stubFetch(new Response("project gone", { status: 404, statusText: "Not Found" }));

    const error = await makeService()
      .json("/things")
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(HttpStatusError);
    expect(error).toMatchObject({
      status: 404,
      statusText: "Not Found",
      body: "project gone",
      service: "TestService",
      url: `${BASE}/things`,
    });
  });

  it("keeps the response body out of the message, which tRPC forwards to the browser", async () => {
    stubFetch(
      new Response("token=s3cret leaked from an internal host", {
        status: 500,
        statusText: "Internal Server Error",
      })
    );

    const error = (await makeService()
      .json("/things")
      .catch((caught: unknown) => caught)) as HttpStatusError;

    expect(error.message).toBe("TestService request failed: 500 Internal Server Error");
    expect(error.message).not.toContain("s3cret");
    expect(error.body).toContain("s3cret");
  });

  it("is not a TRPCError, so router catch blocks can classify it themselves", async () => {
    stubFetch(new Response("nope", { status: 500 }));

    await expect(makeService().json("/things")).rejects.not.toBeInstanceOf(TRPCError);
  });
});

describe("createHttpService cancellation", () => {
  it("reports a hung upstream as a timeout naming its own budget", async () => {
    stubHangingFetch();

    const error = (await makeService({ timeoutMs: 10 })
      .json("/things")
      .catch((caught: unknown) => caught)) as HttpTimeoutError;

    expect(error).toBeInstanceOf(HttpTimeoutError);
    expect(error.message).toBe("TestService request timed out after 10ms");
  });

  it("reports a caller disconnect as cancelled, not as a timeout", async () => {
    stubHangingFetch();
    const controller = new AbortController();
    const pending = makeService({ timeoutMs: 30_000 }).json("/things", { signal: controller.signal });
    controller.abort();

    const error = await pending.catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(HttpCancelledError);
    expect(error).not.toBeInstanceOf(HttpTimeoutError);
  });

  // The Prometheus procedures pass AbortSignal.timeout(budget) as the caller signal. A budget
  // expiry is a timeout, not a disconnect, and the routers classify it as GATEWAY_TIMEOUT.
  it("reports an expired caller budget as a timeout, not a cancellation", async () => {
    stubHangingFetch();

    const error = await makeService({ timeoutMs: 30_000 })
      .json("/things", { signal: AbortSignal.timeout(10) })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(HttpTimeoutError);
    expect((error as HttpTimeoutError).message).toBe("TestService request timed out");
  });

  it("reports a TimeoutError from the runtime as a timeout", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(Object.assign(new Error("The operation was aborted"), { name: "TimeoutError" }))
    );

    await expect(makeService({ timeoutMs: 25 }).json("/things")).rejects.toBeInstanceOf(HttpTimeoutError);
  });

  it("passes a network failure through untouched", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    await expect(makeService().json("/things")).rejects.toThrow("fetch failed");
  });
});

describe("withTRPCErrors", () => {
  function wrapped(overrides: Partial<Parameters<typeof createHttpService>[0]> = {}) {
    return withTRPCErrors(makeService(overrides));
  }

  it.each([
    [400, "BAD_REQUEST"],
    [401, "FORBIDDEN"],
    [403, "FORBIDDEN"],
    [404, "NOT_FOUND"],
    [408, "TIMEOUT"],
    [409, "CONFLICT"],
    [429, "TOO_MANY_REQUESTS"],
    [418, "INTERNAL_SERVER_ERROR"],
    [500, "INTERNAL_SERVER_ERROR"],
    [503, "INTERNAL_SERVER_ERROR"],
  ])("maps status %i to the tRPC code %s", async (status, code) => {
    stubFetch(new Response("nope", { status }));

    await expect(wrapped().json("/things")).rejects.toMatchObject({ code });
  });

  it("never maps 401 to UNAUTHORIZED, which would log the portal user out", async () => {
    stubFetch(new Response("bad token", { status: 401 }));

    await expect(wrapped().json("/things")).rejects.not.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("keeps the original error as the cause", async () => {
    stubFetch(new Response("nope", { status: 404 }));

    const error = (await wrapped()
      .json("/things")
      .catch((caught: unknown) => caught)) as TRPCError;

    expect(error).toBeInstanceOf(TRPCError);
    expect(error.cause).toBeInstanceOf(HttpStatusError);
    expect((error.cause as HttpStatusError).status).toBe(404);
  });

  it("maps a timeout to TIMEOUT", async () => {
    stubHangingFetch();

    await expect(wrapped({ timeoutMs: 10 }).json("/things")).rejects.toMatchObject({ code: "TIMEOUT" });
  });

  it("maps a caller disconnect to CLIENT_CLOSED_REQUEST", async () => {
    stubHangingFetch();
    const controller = new AbortController();
    const pending = wrapped({ timeoutMs: 30_000 }).json("/things", { signal: controller.signal });
    controller.abort();

    await expect(pending).rejects.toMatchObject({ code: "CLIENT_CLOSED_REQUEST" });
  });

  it("passes a ZodError through untouched", async () => {
    stubFetch(jsonResponse({ total: "seven" }));

    const error = await wrapped()
      .json("/things", { schema: z.object({ total: z.number() }) })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(z.ZodError);
    expect(error).not.toBeInstanceOf(TRPCError);
  });

  it("passes a network failure through untouched", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    const error = await wrapped()
      .json("/things")
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(TypeError);
    expect(error).not.toBeInstanceOf(TRPCError);
  });
});

describe("createHttpService.json", () => {
  const schema = z.object({ total: z.number() });

  it("returns the decoded body when no schema is given", async () => {
    stubFetch(jsonResponse({ anything: true }));

    await expect(makeService().json("/things")).resolves.toEqual({ anything: true });
  });

  it("returns the parsed body when the schema matches", async () => {
    stubFetch(jsonResponse({ total: 7 }));

    await expect(makeService().json("/things", { schema })).resolves.toEqual({ total: 7 });
  });

  it("throws the ZodError when the schema does not match", async () => {
    stubFetch(jsonResponse({ total: "seven" }));

    await expect(makeService().json("/things", { schema })).rejects.toThrow(z.ZodError);
  });
});

describe("createHttpService.jsonWithHeaders", () => {
  it("returns the body and the response headers", async () => {
    stubFetch(jsonResponse([], { headers: { "x-total-count": "42" } }));

    const { data, headers } = await makeService().jsonWithHeaders("/things");

    expect(data).toEqual([]);
    expect(headers.get("x-total-count")).toBe("42");
  });

  it("throws an HttpStatusError before any header is read", async () => {
    stubFetch(new Response("nope", { status: 500 }));

    await expect(makeService().jsonWithHeaders("/things")).rejects.toBeInstanceOf(HttpStatusError);
  });
});

describe("createHttpService.text", () => {
  it("returns the raw body and asks for text", async () => {
    const fetchMock = stubFetch(new Response("line one\nline two", { status: 200 }));

    await expect(makeService().text("/logs/abc")).resolves.toBe("line one\nline two");
    expect(requestInit(fetchMock).headers).toEqual({ Accept: "text/plain" });
  });
});
