import { createMockedContext } from "../../../../../__mocks__/context.js";
import { createCaller } from "../../../../../routers/index.js";
import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { K8sClient } from "../../../../../clients/k8s/index.js";

vi.mock("../../../../../clients/k8s/index.js", () => ({
  K8sClient: vi.fn(),
}));

describe("k8sTestIntegrationConnectionProcedure", () => {
  let mockContext: ReturnType<typeof createMockedContext>;
  let fetchSpy: Mock;

  beforeEach(() => {
    (K8sClient as unknown as Mock).mockImplementation(() => ({
      KubeConfig: {},
    }));
    mockContext = createMockedContext();
    fetchSpy = vi.spyOn(globalThis, "fetch") as unknown as Mock;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return success when the service responds with 200", async () => {
    fetchSpy.mockResolvedValueOnce({ ok: true, status: 200 } as Response);

    const caller = createCaller(mockContext);
    const result = await caller.k8s.testIntegrationConnection({
      serviceType: "argocd",
      url: "https://argocd.example.com",
      token: "my-token",
    });

    expect(result).toEqual({ success: true });
    expect(fetchSpy).toHaveBeenCalledWith("https://argocd.example.com/api/v1/clusters", {
      method: "GET",
      headers: { Authorization: "Bearer my-token" },
      signal: expect.any(AbortSignal),
    });
  });

  it("should return UNAUTHORIZED when the service responds with 401", async () => {
    fetchSpy.mockResolvedValueOnce({ ok: false, status: 401 } as Response);

    const caller = createCaller(mockContext);
    const result = await caller.k8s.testIntegrationConnection({
      serviceType: "argocd",
      url: "https://argocd.example.com/",
      token: "bad-token",
    });

    expect(result).toMatchObject({
      success: false,
      error: "UNAUTHORIZED",
      statusCode: 401,
    });
  });

  it("should return success when ArgoCD returns 403 (token valid, lacks permission)", async () => {
    fetchSpy.mockResolvedValueOnce({ ok: false, status: 403 } as Response);

    const caller = createCaller(mockContext);
    const result = await caller.k8s.testIntegrationConnection({
      serviceType: "argocd",
      url: "https://argocd.example.com",
      token: "valid-but-limited-token",
    });

    expect(result).toEqual({ success: true });
  });

  it("should return NETWORK when fetch rejects with a connection error", async () => {
    fetchSpy.mockRejectedValueOnce(new Error("connect ECONNREFUSED"));

    const caller = createCaller(mockContext);
    const result = await caller.k8s.testIntegrationConnection({
      serviceType: "argocd",
      url: "https://argocd.example.com",
      token: "my-token",
    });

    expect(result).toMatchObject({
      success: false,
      error: "NETWORK",
    });
    expect(result.message).toContain("ECONNREFUSED");
    expect(result.message).toContain("Connection refused");
  });

  it("should extract cause from generic fetch failed errors", async () => {
    const causeError = new Error("connect EHOSTUNREACH 10.96.1.5:8081");
    const fetchError = new Error("fetch failed");
    (fetchError as any).cause = causeError;
    fetchSpy.mockRejectedValueOnce(fetchError);

    const caller = createCaller(mockContext);
    const result = await caller.k8s.testIntegrationConnection({
      serviceType: "nexus",
      url: "http://nexus.nexus:8081",
      token: btoa("user:pass"),
    });

    expect(result).toMatchObject({
      success: false,
      error: "NETWORK",
    });
    expect(result.message).toContain("EHOSTUNREACH");
  });

  it("should return TIMEOUT when the request is aborted after 10 seconds", async () => {
    vi.useFakeTimers();

    fetchSpy.mockImplementation(
      (_url, options) =>
        new Promise((_, reject) => {
          const signal = (options as RequestInit).signal!;
          signal.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        }) as Promise<Response>
    );

    const caller = createCaller(mockContext);
    const resultPromise = caller.k8s.testIntegrationConnection({
      serviceType: "argocd",
      url: "https://argocd.example.com",
      token: "my-token",
    });

    await vi.advanceTimersByTimeAsync(10_001);

    const result = await resultPromise;

    expect(result).toMatchObject({
      success: false,
      error: "TIMEOUT",
    });

    vi.useRealTimers();
  });

  it("should use X-Api-Key header for DependencyTrack instead of Authorization", async () => {
    fetchSpy.mockResolvedValueOnce({ ok: true, status: 200 } as Response);

    const caller = createCaller(mockContext);
    const result = await caller.k8s.testIntegrationConnection({
      serviceType: "dependencyTrack",
      url: "https://dtrack.example.com",
      token: "my-api-key",
    });

    expect(result).toEqual({ success: true });
    expect(fetchSpy).toHaveBeenCalledWith("https://dtrack.example.com/api/v1/project", {
      method: "GET",
      headers: { "X-Api-Key": "my-api-key" },
      signal: expect.any(AbortSignal),
    });
  });

  it("should reject with a Zod error when serviceType is invalid", async () => {
    const caller = createCaller(mockContext);

    await expect(
      caller.k8s.testIntegrationConnection({
        serviceType: "invalid-service" as any,
        url: "https://example.com",
        token: "my-token",
      })
    ).rejects.toThrow();
  });
});
