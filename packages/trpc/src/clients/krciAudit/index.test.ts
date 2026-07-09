import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KrciAuditClient } from "./index.js";

const BASE = "http://krci-audit.krci:8080";

let fetchMock: ReturnType<typeof vi.fn>;
let originalFetch: typeof globalThis.fetch;

function mockFetchOnce(body: unknown, status = 200) {
  fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  );
  globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
}

beforeEach(() => {
  originalFetch = globalThis.fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("createKrciAuditClient", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("throws when KRCI_AUDIT_URL is not set", async () => {
    delete process.env.KRCI_AUDIT_URL;
    const { createKrciAuditClient } = await import("./index.js");

    expect(() => createKrciAuditClient()).toThrow("KRCI_AUDIT_URL");
  });

  it("returns a client when the env is configured", async () => {
    process.env.KRCI_AUDIT_URL = BASE;
    const { createKrciAuditClient } = await import("./index.js");

    const client = createKrciAuditClient();

    // Not `toBeInstanceOf`: the dynamic import above (after vi.resetModules) yields a
    // distinct KrciAuditClient class identity from the static import at the top of the file.
    expect(client).toBeDefined();
    expect(typeof client.getInitiator).toBe("function");
  });
});

describe("KrciAuditClient", () => {
  it("throws when apiBaseURL is empty", () => {
    expect(() => new KrciAuditClient({ apiBaseURL: "" })).toThrow("API base URL is not configured");
  });

  it("strips a trailing slash from the base URL", async () => {
    mockFetchOnce({ found: false });
    const client = new KrciAuditClient({ apiBaseURL: `${BASE}/` });

    await client.getInitiator({ objectUid: "uid-123" });

    // A single slash between host and path proves the trailing slash was stripped (no "8080//api").
    expect(String(fetchMock.mock.calls[0][0])).toBe(`${BASE}/api/v1/audit/initiator?objectUid=uid-123`);
  });
});

describe("KrciAuditClient.getInitiator", () => {
  it("requests by objectUid and returns the parsed result", async () => {
    mockFetchOnce({ found: true, actor: "dev@example.com", operation: "CREATE", timestamp: "2026-07-06T00:00:00Z" });
    const client = new KrciAuditClient({ apiBaseURL: BASE });

    const result = await client.getInitiator({ objectUid: "uid-123" });

    expect(result).toEqual({
      found: true,
      actor: "dev@example.com",
      operation: "CREATE",
      timestamp: "2026-07-06T00:00:00Z",
    });
    expect(String(fetchMock.mock.calls[0][0])).toBe(`${BASE}/api/v1/audit/initiator?objectUid=uid-123`);
  });

  it("requests by kind+namespace+name, encoding each param", async () => {
    mockFetchOnce({ found: true, actor: "system:serviceaccount:krci:krci-admin", operation: "CREATE" });
    const client = new KrciAuditClient({ apiBaseURL: BASE });

    await client.getInitiator({ kind: "PipelineRun", namespace: "krci", name: "run a/b" });

    expect(String(fetchMock.mock.calls[0][0])).toBe(
      `${BASE}/api/v1/audit/initiator?kind=PipelineRun&namespace=krci&name=run+a%2Fb`
    );
  });

  it("returns found:false for an un-audited object (not an error)", async () => {
    mockFetchOnce({ found: false });
    const client = new KrciAuditClient({ apiBaseURL: BASE });

    const result = await client.getInitiator({ objectUid: "uid-never-audited" });

    expect(result).toEqual({ found: false });
  });

  it("throws when the response shape is invalid (missing required `found`)", async () => {
    mockFetchOnce({ actor: "dev@example.com" });
    const client = new KrciAuditClient({ apiBaseURL: BASE });

    await expect(client.getInitiator({ objectUid: "uid-123" })).rejects.toThrow();
  });

  it("throws a TRPCError for a 500 response", async () => {
    mockFetchOnce({ code: "internal_error", message: "boom" }, 500);
    const client = new KrciAuditClient({ apiBaseURL: BASE });

    await expect(client.getInitiator({ objectUid: "uid-123" })).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
  });

  it("throws a TRPCError for a 400 response", async () => {
    mockFetchOnce({ code: "bad_request", message: "provide objectUid" }, 400);
    const client = new KrciAuditClient({ apiBaseURL: BASE });

    await expect(client.getInitiator({ kind: "PipelineRun", namespace: "krci", name: "" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });
});

describe("KrciAuditClient.getAuditEvents", () => {
  const sampleEvent = {
    eventUid: "event-1",
    receivedAt: "2026-07-08T00:00:00Z",
    operation: "CREATE",
    apiGroup: "tekton.dev",
    apiVersion: "v1",
    resource: "pipelineruns",
    kind: "PipelineRun",
    namespace: "krci",
    name: "run-1",
    username: "kubernetes-admin",
    dryRun: false,
  };

  it("requests with filter/pagination params serialized as query strings", async () => {
    mockFetchOnce({ data: [sampleEvent], pagination: { total: 1, page: 1, perPage: 20 } });
    const client = new KrciAuditClient({ apiBaseURL: BASE });

    const result = await client.getAuditEvents({ kind: "PipelineRun", namespace: "krci", page: 1, perPage: 20 });

    expect(result.data).toHaveLength(1);
    expect(result.pagination).toEqual({ total: 1, page: 1, perPage: 20 });
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      `${BASE}/api/v1/audit/events?kind=PipelineRun&namespace=krci&page=1&perPage=20`
    );
  });

  it("omits undefined filters from the query string", async () => {
    mockFetchOnce({ data: [], pagination: { total: 0, page: 1, perPage: 20 } });
    const client = new KrciAuditClient({ apiBaseURL: BASE });

    await client.getAuditEvents({ kind: undefined, actor: "kubernetes-admin" });

    expect(String(fetchMock.mock.calls[0][0])).toBe(`${BASE}/api/v1/audit/events?actor=kubernetes-admin`);
  });

  it("returns an empty list when there is no match (not an error)", async () => {
    mockFetchOnce({ data: [], pagination: { total: 0, page: 1, perPage: 20 } });
    const client = new KrciAuditClient({ apiBaseURL: BASE });

    const result = await client.getAuditEvents({ actor: "no-such-user" });

    expect(result.data).toEqual([]);
  });

  it("throws when the response shape is invalid (missing required event fields)", async () => {
    mockFetchOnce({ data: [{ eventUid: "event-1" }], pagination: { total: 1, page: 1, perPage: 20 } });
    const client = new KrciAuditClient({ apiBaseURL: BASE });

    await expect(client.getAuditEvents({})).rejects.toThrow();
  });

  it("throws a TRPCError for a 403 response (remapped to FORBIDDEN)", async () => {
    mockFetchOnce({ code: "forbidden", message: "denied" }, 403);
    const client = new KrciAuditClient({ apiBaseURL: BASE });

    await expect(client.getAuditEvents({})).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("KrciAuditClient.getFacets", () => {
  it("builds a comma-separated fields query string and parses the response", async () => {
    mockFetchOnce({
      namespace: { values: ["default", "krci"], truncated: false },
      kind: { values: ["PipelineRun"], truncated: false },
      actor: { values: [], truncated: true },
    });
    const client = new KrciAuditClient({ apiBaseURL: BASE });

    const result = await client.getFacets(["namespace", "kind", "actor"]);

    expect(String(fetchMock.mock.calls[0][0])).toBe(`${BASE}/api/v1/audit/facets?fields=namespace%2Ckind%2Cactor`);
    expect(result).toEqual({
      namespace: { values: ["default", "krci"], truncated: false },
      kind: { values: ["PipelineRun"], truncated: false },
      actor: { values: [], truncated: true },
    });
  });

  it("omits fields not requested, mirroring the response krci-audit returns for a subset", async () => {
    mockFetchOnce({ namespace: { values: ["krci"], truncated: false } });
    const client = new KrciAuditClient({ apiBaseURL: BASE });

    const result = await client.getFacets(["namespace"]);

    expect(String(fetchMock.mock.calls[0][0])).toBe(`${BASE}/api/v1/audit/facets?fields=namespace`);
    expect(result).toEqual({ namespace: { values: ["krci"], truncated: false } });
    expect(result.kind).toBeUndefined();
  });

  it("throws when the response shape is invalid (missing required `truncated`)", async () => {
    mockFetchOnce({ namespace: { values: ["krci"] } });
    const client = new KrciAuditClient({ apiBaseURL: BASE });

    await expect(client.getFacets(["namespace"])).rejects.toThrow();
  });

  it("throws a TRPCError for a 403 response (remapped to FORBIDDEN)", async () => {
    mockFetchOnce({ code: "forbidden", message: "denied" }, 403);
    const client = new KrciAuditClient({ apiBaseURL: BASE });

    await expect(client.getFacets(["namespace", "kind", "actor"])).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
