import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockedContext } from "../../../../__mocks__/context.js";

const mockListResource = vi.fn();
const mockRangeQuery = vi.fn();
const mockInstantQuery = vi.fn();

vi.mock("../../../../clients/k8s/index.js", () => ({
  K8sClient: vi.fn().mockImplementation(() => ({
    KubeConfig: {},
    listResource: mockListResource,
  })),
}));

vi.mock("../../../../clients/prometheus/index.js", () => ({
  createPrometheusClient: () => ({
    rangeQuery: mockRangeQuery,
    instantQuery: mockInstantQuery,
  }),
}));

async function getCaller() {
  const { createCaller } = await import("../../../../routers/index.js");
  return createCaller(createMockedContext());
}

const validInput = {
  clusterName: "in-cluster",
  namespace: "test-namespace",
  applications: ["test-app"],
  range: "1h" as const,
};

const emptyMatrix = {
  status: "success" as const,
  data: { resultType: "matrix" as const, result: [] },
};

const emptyVector = {
  status: "success" as const,
  data: { resultType: "vector" as const, result: [] },
};

describe("prometheus.getDeploymentMetrics", () => {
  beforeEach(() => {
    mockRangeQuery.mockResolvedValue(emptyMatrix);
    mockInstantQuery.mockResolvedValue(emptyVector);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("short-circuits when applications is empty (no K8s, no Prometheus)", async () => {
    const caller = await getCaller();
    const result = await caller.prometheus.getDeploymentMetrics({ ...validInput, applications: [] });

    expect(mockListResource).not.toHaveBeenCalled();
    expect(mockRangeQuery).not.toHaveBeenCalled();
    expect(mockInstantQuery).not.toHaveBeenCalled();
    expect(result.compute.cpu).toEqual([]);
    expect(result.compute.memoryRss).toEqual([]);
    expect(result.network.rx).toEqual([]);
    expect(result.health.podPhase).toEqual([]);
    expect(result.quotas.cpuLimits).toEqual([]);
    expect(result.range).toBe("1h");
    expect(typeof result.queriedAt).toBe("number");
  });

  it("throws INTERNAL_SERVER_ERROR when K8sClient KubeConfig is uninitialized", async () => {
    const caller = await getCaller();

    const k8sClientModule = await import("../../../../clients/k8s/index.js");
    const K8sClientMock = vi.mocked(k8sClientModule.K8sClient);
    K8sClientMock.mockImplementationOnce(
      () =>
        ({
          KubeConfig: null,
          listResource: mockListResource,
        }) as unknown as InstanceType<typeof k8sClientModule.K8sClient>
    );

    await expect(caller.prometheus.getDeploymentMetrics(validInput)).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
    expect(mockListResource).not.toHaveBeenCalled();
  });

  it("fans out 16 range queries + 1 instant query and groups output by section", async () => {
    mockListResource.mockResolvedValueOnce({
      items: [
        { metadata: { name: "frontend-1", labels: { "app.kubernetes.io/instance": "frontend" } } },
        { metadata: { name: "frontend-2", labels: { "app.kubernetes.io/instance": "frontend" } } },
        { metadata: { name: "api-1", labels: { "app.kubernetes.io/instance": "api" } } },
      ],
    });
    mockRangeQuery.mockResolvedValue({
      status: "success",
      data: {
        resultType: "matrix",
        result: [
          {
            metric: { pod: "frontend-1" },
            values: [
              [100, "1.0"],
              [110, "2.0"],
            ],
          },
          { metric: { pod: "frontend-2" }, values: [[110, "0.5"]] },
          { metric: { pod: "api-1" }, values: [[100, "3.0"]] },
        ],
      },
    });
    mockInstantQuery.mockResolvedValueOnce({
      status: "success",
      data: {
        resultType: "vector",
        result: [
          { metric: { pod: "frontend-1", phase: "Running" }, value: [100, "1"] },
          { metric: { pod: "frontend-2", phase: "Pending" }, value: [100, "1"] },
          { metric: { pod: "api-1", phase: "Running" }, value: [100, "1"] },
        ],
      },
    });

    const caller = await getCaller();
    const result = await caller.prometheus.getDeploymentMetrics({
      ...validInput,
      applications: ["frontend", "api"],
    });

    expect(mockRangeQuery).toHaveBeenCalledTimes(16);
    expect(mockInstantQuery).toHaveBeenCalledTimes(1);
    const cpuCall = mockRangeQuery.mock.calls.find(([q]) => q.query.includes("container_cpu_usage_seconds_total"));
    expect(cpuCall?.[0].query).toContain('namespace="test-namespace"');
    expect(cpuCall?.[0].query).toContain("frontend-1");
    expect(cpuCall?.[0].query).toContain("api-1");

    const cpuFrontend = result.compute.cpu.find((r) => r.app === "frontend");
    expect(cpuFrontend?.series).toEqual([
      { t: 100, v: 1.0 },
      { t: 110, v: 2.5 },
    ]);
    const phaseFrontend = result.health.podPhase.find((r) => r.app === "frontend");
    expect(phaseFrontend?.pods).toEqual([
      { name: "frontend-1", phase: "Running" },
      { name: "frontend-2", phase: "Pending" },
    ]);
    expect(result.network.rx.find((r) => r.app === "api")?.series).toEqual([{ t: 100, v: 3.0 }]);
  });

  it("returns empty grouped series per app when zero pods match (no Prometheus call)", async () => {
    mockListResource.mockResolvedValueOnce({ items: [] });
    const caller = await getCaller();
    const result = await caller.prometheus.getDeploymentMetrics({
      ...validInput,
      applications: ["frontend", "api"],
    });

    expect(mockRangeQuery).not.toHaveBeenCalled();
    expect(mockInstantQuery).not.toHaveBeenCalled();
    expect(result.compute.cpu.map((r) => r.app)).toEqual(["frontend", "api"]);
    expect(result.compute.cpu.every((r) => r.series.length === 0)).toBe(true);
    expect(result.health.podPhase.every((r) => r.pods.length === 0)).toBe(true);
  });

  it("includes an app with no pods as empty series alongside apps that do have pods", async () => {
    mockListResource.mockResolvedValueOnce({
      items: [{ metadata: { name: "frontend-1", labels: { "app.kubernetes.io/instance": "frontend" } } }],
    });
    const caller = await getCaller();
    const result = await caller.prometheus.getDeploymentMetrics({
      ...validInput,
      applications: ["frontend", "missing"],
    });

    expect(mockRangeQuery).toHaveBeenCalledTimes(16);
    const missing = result.compute.cpu.find((r) => r.app === "missing");
    expect(missing).toBeDefined();
    expect(missing?.series).toEqual([]);
    const frontend = result.compute.cpu.find((r) => r.app === "frontend");
    expect(frontend).toBeDefined();
    const missingPhase = result.health.podPhase.find((r) => r.app === "missing");
    expect(missingPhase?.pods).toEqual([]);
  });

  it("maps Prometheus rejection to BAD_GATEWAY", async () => {
    mockListResource.mockResolvedValueOnce({
      items: [{ metadata: { name: "p", labels: { "app.kubernetes.io/instance": "test-app" } } }],
    });
    mockRangeQuery.mockRejectedValueOnce(new Error("ECONNREFUSED"));

    const caller = await getCaller();
    await expect(caller.prometheus.getDeploymentMetrics(validInput)).rejects.toMatchObject({
      code: "BAD_GATEWAY",
    });
  });

  it("maps timeout messages to GATEWAY_TIMEOUT", async () => {
    mockListResource.mockResolvedValueOnce({
      items: [{ metadata: { name: "p", labels: { "app.kubernetes.io/instance": "test-app" } } }],
    });
    mockRangeQuery.mockRejectedValueOnce(new Error("Prometheus request timed out after 10000ms"));

    const caller = await getCaller();
    await expect(caller.prometheus.getDeploymentMetrics(validInput)).rejects.toMatchObject({
      code: "GATEWAY_TIMEOUT",
    });
  });

  it("Zod rejects bad namespace", async () => {
    const caller = await getCaller();
    await expect(
      caller.prometheus.getDeploymentMetrics({ ...validInput, namespace: "Bad_Namespace!" })
    ).rejects.toThrow();
  });

  it("Zod rejects unsupported range", async () => {
    const caller = await getCaller();
    await expect(
      // @ts-expect-error — deliberately invalid
      caller.prometheus.getDeploymentMetrics({ ...validInput, range: "2h" })
    ).rejects.toThrow();
  });

  it("Zod rejects more than 50 applications", async () => {
    const caller = await getCaller();
    const apps = Array.from({ length: 51 }, (_, i) => `app-${i}`);
    await expect(caller.prometheus.getDeploymentMetrics({ ...validInput, applications: apps })).rejects.toThrow();
  });

  it.each([
    ["uppercase letters", "MyApp"],
    ["underscore", "my_app"],
    ["leading hyphen", "-my-app"],
    ["trailing hyphen", "my-app-"],
    ["dot", "my.app"],
  ])("Zod rejects application name with %s (%s)", async (_label, badApp) => {
    const caller = await getCaller();
    await expect(caller.prometheus.getDeploymentMetrics({ ...validInput, applications: [badApp] })).rejects.toThrow();
  });

  it("computes start = end - 86400 and step = 300 for range 24h", async () => {
    mockListResource.mockResolvedValueOnce({
      items: [{ metadata: { name: "p", labels: { "app.kubernetes.io/instance": "test-app" } } }],
    });
    const caller = await getCaller();
    await caller.prometheus.getDeploymentMetrics({ ...validInput, range: "24h" });
    const firstCall = mockRangeQuery.mock.calls[0]?.[0];
    expect(firstCall).toBeDefined();
    expect(firstCall.end - firstCall.start).toBe(86400);
    expect(firstCall.step).toBe(300);
  });

  it("aborts in-flight queries via the shared signal when one query rejects", async () => {
    mockListResource.mockResolvedValueOnce({
      items: [{ metadata: { name: "p", labels: { "app.kubernetes.io/instance": "test-app" } } }],
    });
    const seenSignals: AbortSignal[] = [];
    mockRangeQuery.mockImplementation((_params: unknown, signal: AbortSignal) => {
      seenSignals.push(signal);
      return new Promise((_res, reject) => {
        signal.addEventListener("abort", () => {
          const err = new Error("aborted");
          err.name = "AbortError";
          reject(err);
        });
      });
    });
    // First call rejects synchronously; remaining calls hang until aborted.
    mockRangeQuery.mockImplementationOnce((_params: unknown, signal: AbortSignal) => {
      seenSignals.push(signal);
      return Promise.reject(new Error("ECONNREFUSED"));
    });

    const caller = await getCaller();
    await expect(caller.prometheus.getDeploymentMetrics(validInput)).rejects.toMatchObject({
      code: "BAD_GATEWAY",
    });

    expect(seenSignals.length).toBeGreaterThan(1);
    // All non-rejecting signals must have been aborted by sharedAbort.
    for (const signal of seenSignals.slice(1)) {
      expect(signal.aborted).toBe(true);
    }
  });
});
