import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { createMockedContext } from "../../../../__mocks__/context.js";

const mockInstantQuery = vi.fn();
const mockCreatePrometheusClient = vi.fn(() => ({ instantQuery: mockInstantQuery }));

vi.mock("../../../../clients/prometheus/index.js", () => ({
  createPrometheusClient: () => mockCreatePrometheusClient(),
}));

async function getCaller() {
  const { createCaller } = await import("../../../../routers/index.js");
  return createCaller(createMockedContext());
}

const validInput = {
  clusterName: "in-cluster",
  namespace: "krci-demo-dev",
};

const emptyVector = {
  status: "success" as const,
  data: { resultType: "vector" as const, result: [] },
};

describe("prometheus.getExposureMetrics", () => {
  beforeEach(() => {
    mockInstantQuery.mockResolvedValue(emptyVector);
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockCreatePrometheusClient.mockImplementation(() => ({ instantQuery: mockInstantQuery }));
  });

  it("returns empty backends when Prometheus returns no data", async () => {
    const caller = await getCaller();
    const result = await caller.prometheus.getExposureMetrics(validInput);
    expect(result.backends).toEqual([]);
    expect(typeof result.queriedAt).toBe("number");
  });

  it("fires exactly 2 instant queries (rps + success)", async () => {
    const caller = await getCaller();
    await caller.prometheus.getExposureMetrics(validInput);
    expect(mockInstantQuery).toHaveBeenCalledTimes(2);
  });

  it("includes the namespace in the PromQL selector", async () => {
    const caller = await getCaller();
    await caller.prometheus.getExposureMetrics(validInput);
    const firstCall = mockInstantQuery.mock.calls[0]?.[0];
    expect(firstCall?.query).toContain("krci-demo-dev");
    expect(firstCall?.query).toContain("httproute/krci-demo-dev/");
    // success query (index 1) also scopes to the namespace
    expect(mockInstantQuery.mock.calls[1]?.[0]?.query).toContain("krci-demo-dev");
    expect(mockInstantQuery.mock.calls[1]?.[0]?.query).toContain("envoy_response_code_class");
  });

  it("returns aggregated backends from real data", async () => {
    const vectorWithData = {
      status: "success" as const,
      data: {
        resultType: "vector" as const,
        result: [
          {
            metric: { envoy_cluster_name: "httproute/krci-demo-dev/test-go-app/rule/0" },
            value: [0, "5.5"] as [number, string],
          },
        ],
      },
    };
    mockInstantQuery.mockResolvedValue(vectorWithData);

    const caller = await getCaller();
    const result = await caller.prometheus.getExposureMetrics(validInput);
    // A single-rule route produces 2 entries: route-level ("<ns>/<route>") and
    // per-rule ("<ns>/<route>/0"). Both carry the same rps for a sole rule.
    expect(result.backends).toHaveLength(2);
    const routeEntry = result.backends.find((b) => b.key === "krci-demo-dev/test-go-app");
    expect(routeEntry).toMatchObject({
      key: "krci-demo-dev/test-go-app",
      routeNamespace: "krci-demo-dev",
      routeName: "test-go-app",
      rps: 5.5,
    });
    const ruleEntry = result.backends.find((b) => b.key === "krci-demo-dev/test-go-app/0");
    expect(ruleEntry).toMatchObject({
      key: "krci-demo-dev/test-go-app/0",
      routeNamespace: "krci-demo-dev",
      routeName: "test-go-app",
      rps: 5.5,
    });
  });

  it("propagates PRECONDITION_FAILED when createPrometheusClient throws it", async () => {
    mockCreatePrometheusClient.mockImplementationOnce(() => {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "PROMETHEUS_URL environment variable is not configured",
      });
    });

    const caller = await getCaller();
    await expect(caller.prometheus.getExposureMetrics(validInput)).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
    });
  });

  it("maps Prometheus network failure to BAD_GATEWAY", async () => {
    mockInstantQuery.mockRejectedValueOnce(new Error("ECONNREFUSED"));

    const caller = await getCaller();
    await expect(caller.prometheus.getExposureMetrics(validInput)).rejects.toMatchObject({
      code: "BAD_GATEWAY",
    });
  });

  it("maps timeout messages to GATEWAY_TIMEOUT", async () => {
    mockInstantQuery.mockRejectedValueOnce(new Error("Prometheus request timed out after 10000ms"));

    const caller = await getCaller();
    await expect(caller.prometheus.getExposureMetrics(validInput)).rejects.toMatchObject({
      code: "GATEWAY_TIMEOUT",
    });
  });
});
