import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const originalEnv = process.env;

describe("createPrometheusClient", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should throw TRPCError(PRECONDITION_FAILED) when PROMETHEUS_URL is not set", async () => {
    delete process.env.PROMETHEUS_URL;
    const { createPrometheusClient } = await import("./index.js");

    expect(() => createPrometheusClient()).toThrowError(expect.objectContaining({ code: "PRECONDITION_FAILED" }));
  });

  it("should return a client when PROMETHEUS_URL is configured", async () => {
    process.env.PROMETHEUS_URL = "http://prom.example:9090";
    const { createPrometheusClient } = await import("./index.js");
    const client = createPrometheusClient();

    expect(client).toBeDefined();
    expect(typeof client.rangeQuery).toBe("function");
  });
});

describe("PrometheusClient.rangeQuery URL shape", () => {
  const BASE = "http://prom.example:9090";
  let fetchMock: ReturnType<typeof vi.fn>;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(async () => {
    vi.resetModules();
    originalFetch = globalThis.fetch;
    fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "success",
          data: { resultType: "matrix", result: [] },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  async function newClient() {
    const { PrometheusClient } = await import("./index.js");
    return new PrometheusClient({ baseURL: BASE, timeoutMs: 500 });
  }

  function capturedUrl(): string {
    const firstCall = fetchMock.mock.calls[0];
    return String(firstCall[0]);
  }

  it("rangeQuery encodes query, integer start/end, and step with 's' suffix", async () => {
    const client = await newClient();
    await client.rangeQuery({
      query: 'up{namespace="foo"}',
      start: 1700000000.7,
      end: 1700003600.2,
      step: 30,
    });
    const url = capturedUrl();
    expect(url).toContain("/api/v1/query_range?");
    expect(url).toContain("query=up%7Bnamespace%3D%22foo%22%7D");
    expect(url).toContain("start=1700000000");
    expect(url).toContain("end=1700003600");
    expect(url).toContain("step=30s");
  });

  it("rangeQuery happy path parses matrix shape", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          status: "success",
          data: {
            resultType: "matrix",
            result: [
              {
                metric: { pod: "test-pod-abc123-xyz" },
                values: [
                  [1777712697, "0.0001"],
                  [1777712727, "0.0002"],
                ],
              },
            ],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    const client = await newClient();
    const result = await client.rangeQuery({ query: "x", start: 0, end: 1, step: 1 });
    expect(result.data.result[0]?.metric.pod).toBe("test-pod-abc123-xyz");
    expect(result.data.result[0]?.values).toHaveLength(2);
  });
});

describe("PrometheusClient timeout & errors", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    vi.resetModules();
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("rangeQuery rejects with timeout message when fetch hangs past timeoutMs", async () => {
    globalThis.fetch = vi.fn(
      (_url: string, init: { signal?: AbortSignal } = {}) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => {
            const err = new Error("aborted");
            err.name = "AbortError";
            reject(err);
          });
        })
    ) as unknown as typeof globalThis.fetch;

    const { PrometheusClient } = await import("./index.js");
    const client = new PrometheusClient({ baseURL: "http://x", timeoutMs: 10 });
    await expect(client.rangeQuery({ query: "x", start: 0, end: 1, step: 1 })).rejects.toThrow(/timed out/i);
  });

  it("rangeQuery rejects with status text on non-2xx", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        new Response("bad query", { status: 400, statusText: "Bad Request" })
      ) as unknown as typeof globalThis.fetch;

    const { PrometheusClient } = await import("./index.js");
    const client = new PrometheusClient({ baseURL: "http://x", timeoutMs: 500 });
    await expect(client.rangeQuery({ query: "x", start: 0, end: 1, step: 1 })).rejects.toThrow(/400 Bad Request/);
  });
});
