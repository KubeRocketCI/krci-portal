import { describe, expect, it } from "vitest";
import { escapeRegex, groupPodsByApp, buildPromQLQueries, matrixToSeriesByApp } from "./utils.js";

describe("escapeRegex", () => {
  it("escapes regex meta-characters", () => {
    expect(escapeRegex("a.b+c*")).toBe("a\\.b\\+c\\*");
  });
  it("leaves RFC-1123-safe pod names unchanged", () => {
    expect(escapeRegex("test-pod-abc123-xyz")).toBe("test-pod-abc123-xyz");
  });
  it("escapes pipe and backslash characters", () => {
    expect(escapeRegex("a|b")).toBe("a\\|b");
    expect(escapeRegex("path\\to")).toBe("path\\\\to");
  });
});

describe("groupPodsByApp", () => {
  it("groups pods by app.kubernetes.io/instance label, including apps with zero pods", () => {
    const pods = [
      { metadata: { name: "frontend-1", labels: { "app.kubernetes.io/instance": "frontend" } } },
      { metadata: { name: "frontend-2", labels: { "app.kubernetes.io/instance": "frontend" } } },
      { metadata: { name: "api-1", labels: { "app.kubernetes.io/instance": "api" } } },
    ];
    const result = groupPodsByApp(pods, ["frontend", "api", "worker"]);
    expect(result.get("frontend")).toEqual(["frontend-1", "frontend-2"]);
    expect(result.get("api")).toEqual(["api-1"]);
    expect(result.get("worker")).toEqual([]);
  });
  it("ignores pods whose label value is not in the requested apps list", () => {
    const pods = [{ metadata: { name: "other-1", labels: { "app.kubernetes.io/instance": "other" } } }];
    const result = groupPodsByApp(pods, ["frontend"]);
    expect(result.get("frontend")).toEqual([]);
    expect(result.has("other")).toBe(false);
  });
  it("handles pods whose labels object is entirely absent", () => {
    const pods = [{ metadata: { name: "unlabeled" } }];
    const result = groupPodsByApp(pods, ["frontend"]);
    expect(result.get("frontend")).toEqual([]);
  });
});

describe("buildPromQLQueries", () => {
  it("produces three queries with namespace and combined pod regex interpolated", () => {
    const queries = buildPromQLQueries({
      namespace: "test-namespace",
      podNames: ["test-pod-abc123-xyz", "another-pod"],
    });
    expect(queries.cpu).toContain('namespace="test-namespace"');
    expect(queries.cpu).toContain('pod=~"test-pod-abc123-xyz|another-pod"');
    expect(queries.cpu).toContain("rate(container_cpu_usage_seconds_total");
    expect(queries.memory).toContain("container_memory_working_set_bytes");
    expect(queries.restarts).toContain("kube_pod_container_status_restarts_total");
    expect(queries.restarts).toContain('pod=~"test-pod-abc123-xyz|another-pod"');
  });
  it("escapes regex meta-characters in pod names", () => {
    const queries = buildPromQLQueries({
      namespace: "ns",
      podNames: ["good-pod", "weird.pod"],
    });
    expect(queries.cpu).toContain('pod=~"good-pod|weird\\.pod"');
  });
});

describe("matrixToSeriesByApp", () => {
  it("maps each pod series to its app and aggregates by summing across the app's pods at each timestamp", () => {
    const podToApp = new Map<string, string>([
      ["frontend-1", "frontend"],
      ["frontend-2", "frontend"],
      ["api-1", "api"],
    ]);
    const matrix = {
      status: "success" as const,
      data: {
        resultType: "matrix" as const,
        result: [
          {
            metric: { pod: "frontend-1" },
            values: [
              [100, "1.0"],
              [110, "2.0"],
            ] as Array<[number, string]>,
          },
          {
            metric: { pod: "frontend-2" },
            values: [
              [100, "0.5"],
              [110, "0.5"],
            ] as Array<[number, string]>,
          },
          {
            metric: { pod: "api-1" },
            values: [[100, "3.0"]] as Array<[number, string]>,
          },
        ],
      },
    };
    const known = ["frontend", "api", "worker"];
    const result = matrixToSeriesByApp(matrix, podToApp, known);

    const frontend = result.find((r) => r.app === "frontend");
    expect(frontend?.series).toEqual([
      { t: 100, v: 1.5 },
      { t: 110, v: 2.5 },
    ]);
    const api = result.find((r) => r.app === "api");
    expect(api?.series).toEqual([{ t: 100, v: 3.0 }]);
    const worker = result.find((r) => r.app === "worker");
    expect(worker?.series).toEqual([]);
  });
  it("aggregates partial-timestamp coverage (one pod missing a timestamp)", () => {
    const podToApp = new Map<string, string>([
      ["frontend-1", "frontend"],
      ["frontend-2", "frontend"],
    ]);
    const matrix = {
      status: "success" as const,
      data: {
        resultType: "matrix" as const,
        result: [
          {
            metric: { pod: "frontend-1" },
            values: [
              [100, "1.0"],
              [110, "2.0"],
            ] as Array<[number, string]>,
          },
          {
            metric: { pod: "frontend-2" },
            values: [[100, "0.5"]] as Array<[number, string]>,
          },
        ],
      },
    };
    const result = matrixToSeriesByApp(matrix, podToApp, ["frontend"]);
    expect(result[0]?.series).toEqual([
      { t: 100, v: 1.5 },
      { t: 110, v: 2.0 },
    ]);
  });
  it("preserves the order of `known` apps in the output", () => {
    const result = matrixToSeriesByApp({ status: "success", data: { resultType: "matrix", result: [] } }, new Map(), [
      "b",
      "a",
      "c",
    ]);
    expect(result.map((r) => r.app)).toEqual(["b", "a", "c"]);
  });
});
