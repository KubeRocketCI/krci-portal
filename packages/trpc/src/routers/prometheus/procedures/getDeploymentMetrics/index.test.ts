import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockedContext } from "../../../../__mocks__/context.js";

const mockListResource = vi.fn();
const mockRangeQuery = vi.fn();

vi.mock("../../../../clients/k8s/index.js", () => ({
  K8sClient: vi.fn().mockImplementation(() => ({
    KubeConfig: {},
    listResource: mockListResource,
  })),
}));

vi.mock("../../../../clients/prometheus/index.js", () => ({
  createPrometheusClient: () => ({
    rangeQuery: mockRangeQuery,
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

describe("prometheus.getDeploymentMetrics", () => {
  beforeEach(() => {
    mockRangeQuery.mockResolvedValue(emptyMatrix);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("short-circuits when applications is empty (no K8s, no Prometheus)", async () => {
    const caller = await getCaller();
    const result = await caller.prometheus.getDeploymentMetrics({ ...validInput, applications: [] });

    expect(mockListResource).not.toHaveBeenCalled();
    expect(mockRangeQuery).not.toHaveBeenCalled();
    expect(result.cpu).toEqual([]);
    expect(result.memory).toEqual([]);
    expect(result.restarts).toEqual([]);
    expect(result.range).toBe("1h");
    expect(typeof result.queriedAt).toBe("number");
  });

  it("throws INTERNAL_SERVER_ERROR when K8sClient KubeConfig is uninitialized", async () => {
    // The shared mock at the top of the file always returns KubeConfig: {}.
    // For this test, we need a falsy KubeConfig — use vi.mocked() to override the
    // implementation just for this test.
    //
    // NOTE: getCaller() → createMockedContext() → new K8sClient() consumes one
    // constructor call. We get the caller first, then override the mock so that
    // the very next new K8sClient() call (inside the procedure) returns null KubeConfig.
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

  it("groups pods by app and sends a single combined PromQL pod regex per metric", async () => {
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
          {
            metric: { pod: "frontend-2" },
            values: [[110, "0.5"]],
          },
          {
            metric: { pod: "api-1" },
            values: [[100, "3.0"]],
          },
        ],
      },
    });

    const caller = await getCaller();
    const result = await caller.prometheus.getDeploymentMetrics({
      ...validInput,
      applications: ["frontend", "api"],
    });

    expect(mockRangeQuery).toHaveBeenCalledTimes(3);
    const firstQuery = mockRangeQuery.mock.calls[0][0].query as string;
    expect(firstQuery).toContain('namespace="test-namespace"');
    expect(firstQuery).toContain('pod=~"');
    expect(firstQuery).toContain("frontend-1");
    expect(firstQuery).toContain("frontend-2");
    expect(firstQuery).toContain("api-1");

    const frontend = result.cpu.find((r) => r.app === "frontend");
    expect(frontend?.series).toEqual([
      { t: 100, v: 1.0 },
      { t: 110, v: 2.5 },
    ]);
    const api = result.cpu.find((r) => r.app === "api");
    expect(api?.series).toEqual([{ t: 100, v: 3.0 }]);
  });

  it("includes apps with zero matched pods in the output as empty series", async () => {
    mockListResource.mockResolvedValueOnce({
      items: [{ metadata: { name: "frontend-1", labels: { "app.kubernetes.io/instance": "frontend" } } }],
    });
    const caller = await getCaller();
    const result = await caller.prometheus.getDeploymentMetrics({
      ...validInput,
      applications: ["frontend", "missing"],
    });

    const missing = result.cpu.find((r) => r.app === "missing");
    expect(missing).toBeDefined();
    expect(missing?.series).toEqual([]);

    const frontend = result.cpu.find((r) => r.app === "frontend");
    expect(frontend).toBeDefined();
    expect(mockRangeQuery).toHaveBeenCalledTimes(3);
  });

  it("returns empty series per app when zero pods match any requested app (no Prometheus call)", async () => {
    mockListResource.mockResolvedValueOnce({ items: [] });
    const caller = await getCaller();
    const result = await caller.prometheus.getDeploymentMetrics({
      ...validInput,
      applications: ["frontend", "api"],
    });

    expect(mockRangeQuery).not.toHaveBeenCalled();
    expect(result.cpu.map((r) => r.app)).toEqual(["frontend", "api"]);
    expect(result.cpu.every((r) => r.series.length === 0)).toBe(true);
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
});
