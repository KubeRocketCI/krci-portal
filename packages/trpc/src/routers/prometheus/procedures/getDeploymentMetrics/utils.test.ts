import { describe, expect, it } from "vitest";
import type { MetricSeriesByApp } from "@my-project/shared";
import {
  escapeRegex,
  groupPodsByApp,
  buildPromQLQueries,
  buildPodPhaseQuery,
  combineRatioSeriesByApp,
  deriveRateWindow,
  matrixToPodSeriesByApp,
  vectorToPodPhaseByApp,
} from "./utils.js";

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

describe("deriveRateWindow", () => {
  it("clamps to 300s when 4*step is below the floor", () => {
    expect(deriveRateWindow(15)).toBe("300s"); // 4*15=60
    expect(deriveRateWindow(75)).toBe("300s"); // 4*75=300
  });
  it("uses 4*step when above the floor", () => {
    expect(deriveRateWindow(120)).toBe("480s");
    expect(deriveRateWindow(300)).toBe("1200s");
  });
});

describe("buildPromQLQueries", () => {
  const queries = buildPromQLQueries({
    namespace: "ns",
    applications: ["app-a", "app-b"],
    lookbackWindow: "300s",
  });

  it.each([
    ["cpu", 'rate(container_cpu_usage_seconds_total{namespace="ns", container!="", container!="POD"}[300s])'],
    ["memory", 'container_memory_working_set_bytes{namespace="ns", container!="", container!="POD"}'],
    ["memoryRss", 'container_memory_rss{namespace="ns", container!="", container!="POD"}'],
    ["memoryCache", 'container_memory_cache{namespace="ns", container!="", container!="POD"}'],
    ["restarts", 'increase(kube_pod_container_status_restarts_total{namespace="ns"}[300s])'],
    ["networkRx", 'rate(container_network_receive_bytes_total{namespace="ns"}[300s])'],
    ["networkTx", 'rate(container_network_transmit_bytes_total{namespace="ns"}[300s])'],
    ["diskReadBytes", 'rate(container_fs_reads_bytes_total{namespace="ns", container!="", container!="POD"}[300s])'],
    ["diskWriteBytes", 'rate(container_fs_writes_bytes_total{namespace="ns", container!="", container!="POD"}[300s])'],
    ["oomEvents", 'increase(container_oom_events_total{namespace="ns"}[300s])'],
    ["cpuRequests", 'kube_pod_container_resource_requests{namespace="ns", resource="cpu"}'],
    ["cpuLimits", 'kube_pod_container_resource_limits{namespace="ns", resource="cpu"}'],
    ["memoryRequests", 'kube_pod_container_resource_requests{namespace="ns", resource="memory"}'],
    ["memoryLimits", 'kube_pod_container_resource_limits{namespace="ns", resource="memory"}'],
    [
      "cpuThrottledPeriods",
      'rate(container_cpu_cfs_throttled_periods_total{namespace="ns", container!="", container!="POD"}[300s])',
    ],
    ["cpuPeriods", 'rate(container_cpu_cfs_periods_total{namespace="ns", container!="", container!="POD"}[300s])'],
  ])("emits the expected inner expression for %s", (key, fragment) => {
    expect(queries[key as keyof typeof queries]).toContain(fragment);
  });

  it("joins every metric with kube_pod_labels filtered by application", () => {
    for (const [key, value] of Object.entries(queries)) {
      expect(value, `query ${key}`).toContain(
        '* on (namespace, pod) group_left(label_app_kubernetes_io_instance) kube_pod_labels{namespace="ns", label_app_kubernetes_io_instance=~"^(app-a|app-b)$"}'
      );
    }
  });

  it("wraps every metric in `sum by (pod, label_app_kubernetes_io_instance) (...)` (regression guard for aggregation)", () => {
    for (const [key, value] of Object.entries(queries)) {
      expect(value, `query ${key}`).toMatch(/^sum by \(pod, label_app_kubernetes_io_instance\) \(/);
      expect(value, `query ${key}`).toMatch(/\)$/);
    }
  });

  it("escapes regex meta-characters in application names", () => {
    const q = buildPromQLQueries({
      namespace: "ns",
      applications: ["good-app", "weird.app"],
      lookbackWindow: "300s",
    });
    expect(q.cpu).toContain('label_app_kubernetes_io_instance=~"^(good-app|weird\\.app)$"');
  });

  it("anchors the application regex to prevent prefix-match ambiguity", () => {
    const q = buildPromQLQueries({
      namespace: "ns",
      applications: ["api"],
      lookbackWindow: "300s",
    });
    expect(q.cpu).toContain('label_app_kubernetes_io_instance=~"^(api)$"');
  });

  it("scales rate window with the requested step", () => {
    const fast = buildPromQLQueries({
      namespace: "ns",
      applications: ["a"],
      lookbackWindow: deriveRateWindow(15),
    });
    expect(fast.cpu).toContain("[300s]");
    const slow = buildPromQLQueries({
      namespace: "ns",
      applications: ["a"],
      lookbackWindow: deriveRateWindow(300),
    });
    expect(slow.cpu).toContain("[1200s]");
  });

  it("uses increase() with the rate window (bounded trailing interval)", () => {
    const q = buildPromQLQueries({
      namespace: "ns",
      applications: ["a"],
      lookbackWindow: "1200s",
    });
    expect(q.restarts).toContain("increase(");
    expect(q.restarts).toContain("[1200s]");
    expect(q.oomEvents).toContain("increase(");
    expect(q.oomEvents).toContain("[1200s]");
  });
});

describe("buildPodPhaseQuery", () => {
  it("emits the instant-query selector with == 1", () => {
    const q = buildPodPhaseQuery({ namespace: "ns", podNames: ["pod-a"] });
    expect(q).toBe('kube_pod_status_phase{namespace="ns", pod=~"^(pod-a)$"} == 1');
  });
  it("escapes regex meta-characters in pod names", () => {
    const q = buildPodPhaseQuery({ namespace: "ns", podNames: ["weird.pod"] });
    expect(q).toContain('pod=~"^(weird\\.pod)$"');
  });
});

describe("matrixToPodSeriesByApp", () => {
  const knownApps = ["frontend", "api", "worker"];

  it("partitions matrix rows by app via the label_app_kubernetes_io_instance label", () => {
    const matrix = {
      status: "success" as const,
      data: {
        resultType: "matrix" as const,
        result: [
          {
            metric: { pod: "frontend-1", label_app_kubernetes_io_instance: "frontend" },
            values: [
              [100, "1.0"],
              [110, "2.0"],
            ] as Array<[number, string]>,
          },
          {
            metric: { pod: "frontend-2", label_app_kubernetes_io_instance: "frontend" },
            values: [[100, "0.5"]] as Array<[number, string]>,
          },
          {
            metric: { pod: "api-1", label_app_kubernetes_io_instance: "api" },
            values: [[100, "3.0"]] as Array<[number, string]>,
          },
        ],
      },
    };
    const result = matrixToPodSeriesByApp(matrix, knownApps);
    expect(result.find((r) => r.app === "frontend")?.pods).toEqual([
      {
        pod: "frontend-1",
        series: [
          { t: 100, v: 1.0 },
          { t: 110, v: 2.0 },
        ],
      },
      { pod: "frontend-2", series: [{ t: 100, v: 0.5 }] },
    ]);
    expect(result.find((r) => r.app === "api")?.pods).toEqual([{ pod: "api-1", series: [{ t: 100, v: 3.0 }] }]);
    expect(result.find((r) => r.app === "worker")?.pods).toEqual([]);
  });

  it("does NOT sum across pods (each pod keeps its own series)", () => {
    const matrix = {
      status: "success" as const,
      data: {
        resultType: "matrix" as const,
        result: [
          {
            metric: { pod: "p1", label_app_kubernetes_io_instance: "app" },
            values: [[100, "1.0"]] as Array<[number, string]>,
          },
          {
            metric: { pod: "p2", label_app_kubernetes_io_instance: "app" },
            values: [[100, "2.5"]] as Array<[number, string]>,
          },
        ],
      },
    };
    const result = matrixToPodSeriesByApp(matrix, ["app"]);
    expect(result[0]?.pods.map((p) => ({ pod: p.pod, last: p.series.at(-1)?.v }))).toEqual([
      { pod: "p1", last: 1.0 },
      { pod: "p2", last: 2.5 },
    ]);
  });

  it("drops NaN and empty string values silently", () => {
    const matrix = {
      status: "success" as const,
      data: {
        resultType: "matrix" as const,
        result: [
          {
            metric: { pod: "p1", label_app_kubernetes_io_instance: "app" },
            values: [
              [100, "NaN"],
              [110, "1.0"],
              [120, ""],
              [130, "2.5"],
            ] as Array<[number, string]>,
          },
        ],
      },
    };
    const result = matrixToPodSeriesByApp(matrix, ["app"]);
    expect(result[0]?.pods[0]?.series).toEqual([
      { t: 110, v: 1.0 },
      { t: 130, v: 2.5 },
    ]);
  });

  it("drops series whose app label is not in `knownApps` (defensive)", () => {
    const matrix = {
      status: "success" as const,
      data: {
        resultType: "matrix" as const,
        result: [
          {
            metric: { pod: "p1", label_app_kubernetes_io_instance: "stranger" },
            values: [[100, "1"]] as Array<[number, string]>,
          },
        ],
      },
    };
    const result = matrixToPodSeriesByApp(matrix, ["app"]);
    expect(result[0]?.pods).toEqual([]);
  });

  it("drops series with no pod label or no app label (defensive)", () => {
    const matrix = {
      status: "success" as const,
      data: {
        resultType: "matrix" as const,
        result: [
          {
            metric: { label_app_kubernetes_io_instance: "app" } as Record<string, string>,
            values: [[100, "1"]] as Array<[number, string]>,
          },
          { metric: { pod: "p1" } as Record<string, string>, values: [[100, "1"]] as Array<[number, string]> },
        ],
      },
    };
    const result = matrixToPodSeriesByApp(matrix, ["app"]);
    expect(result[0]?.pods).toEqual([]);
  });

  it("preserves the order of `knownApps` in the output and sorts pods by name within each app", () => {
    const matrix = {
      status: "success" as const,
      data: {
        resultType: "matrix" as const,
        result: [
          {
            metric: { pod: "z-pod", label_app_kubernetes_io_instance: "app" },
            values: [[100, "1"]] as Array<[number, string]>,
          },
          {
            metric: { pod: "a-pod", label_app_kubernetes_io_instance: "app" },
            values: [[100, "2"]] as Array<[number, string]>,
          },
        ],
      },
    };
    const result = matrixToPodSeriesByApp(matrix, ["b", "a", "app"]);
    expect(result.map((r) => r.app)).toEqual(["b", "a", "app"]);
    expect(result.find((r) => r.app === "app")?.pods.map((p) => p.pod)).toEqual(["a-pod", "z-pod"]);
  });
});

describe("vectorToPodPhaseByApp", () => {
  it("groups pods by app and uses the phase label", () => {
    const podToApp = new Map<string, string>([
      ["frontend-1", "frontend"],
      ["frontend-2", "frontend"],
      ["api-1", "api"],
    ]);
    const vector = {
      status: "success" as const,
      data: {
        resultType: "vector" as const,
        result: [
          { metric: { pod: "frontend-1", phase: "Running" }, value: [100, "1"] as [number, string] },
          { metric: { pod: "frontend-2", phase: "Pending" }, value: [100, "1"] as [number, string] },
          { metric: { pod: "api-1", phase: "Running" }, value: [100, "1"] as [number, string] },
        ],
      },
    };
    const result = vectorToPodPhaseByApp(vector, podToApp, ["frontend", "api", "worker"]);
    expect(result.find((r) => r.app === "frontend")?.pods).toEqual([
      { name: "frontend-1", phase: "Running" },
      { name: "frontend-2", phase: "Pending" },
    ]);
    expect(result.find((r) => r.app === "api")?.pods).toEqual([{ name: "api-1", phase: "Running" }]);
    expect(result.find((r) => r.app === "worker")?.pods).toEqual([]);
  });
  it("falls back to Unknown when the phase label is missing or unrecognised", () => {
    const podToApp = new Map<string, string>([["p1", "app"]]);
    const vector = {
      status: "success" as const,
      data: {
        resultType: "vector" as const,
        result: [{ metric: { pod: "p1", phase: "Weird" }, value: [100, "1"] as [number, string] }],
      },
    };
    const result = vectorToPodPhaseByApp(vector, podToApp, ["app"]);
    expect(result[0]?.pods).toEqual([{ name: "p1", phase: "Unknown" }]);
  });
  it("ignores pods not present in podToApp", () => {
    const result = vectorToPodPhaseByApp(
      {
        status: "success",
        data: {
          resultType: "vector",
          result: [{ metric: { pod: "stranger", phase: "Running" }, value: [100, "1"] }],
        },
      },
      new Map(),
      ["app"]
    );
    expect(result[0]?.pods).toEqual([]);
  });

  it("preserves the order of `knownApps` in the output", () => {
    const result = vectorToPodPhaseByApp({ status: "success", data: { resultType: "vector", result: [] } }, new Map(), [
      "b",
      "a",
      "c",
    ]);
    expect(result.map((r) => r.app)).toEqual(["b", "a", "c"]);
  });
});

describe("combineRatioSeriesByApp", () => {
  const podSeries = (pod: string, points: Array<[number, number]>) => ({
    pod,
    series: points.map(([t, v]) => ({ t, v })),
  });
  const app = (name: string, pods: ReturnType<typeof podSeries>[]): MetricSeriesByApp => ({
    app: name,
    pods,
  });

  it("emits 100 * num/den for every (app, pod, t) where the matched denominator is finite and positive", () => {
    const num = [app("a", [podSeries("a-1", [[100, 2]])]), app("b", [podSeries("b-1", [[100, 1]])])];
    const den = [app("a", [podSeries("a-1", [[100, 10]])]), app("b", [podSeries("b-1", [[100, 4]])])];
    const result = combineRatioSeriesByApp(num, den);
    expect(result.find((r) => r.app === "a")?.pods[0]).toEqual({
      pod: "a-1",
      series: [{ t: 100, v: 20 }],
    });
    expect(result.find((r) => r.app === "b")?.pods[0]).toEqual({
      pod: "b-1",
      series: [{ t: 100, v: 25 }],
    });
  });

  it("drops timestamps where the denominator is zero or negative", () => {
    const num = [
      app("a", [
        podSeries("a-1", [
          [100, 1],
          [110, 2],
          [120, 3],
        ]),
      ]),
    ];
    const den = [
      app("a", [
        podSeries("a-1", [
          [100, 0],
          [110, 5],
          [120, -1],
        ]),
      ]),
    ];
    const result = combineRatioSeriesByApp(num, den);
    expect(result[0]?.pods[0]?.series).toEqual([{ t: 110, v: 40 }]);
  });

  it("drops numerator timestamps that have no matching denominator timestamp on the same pod", () => {
    const num = [
      app("a", [
        podSeries("a-1", [
          [100, 1],
          [110, 2],
        ]),
      ]),
    ];
    const den = [app("a", [podSeries("a-1", [[110, 5]])])];
    const result = combineRatioSeriesByApp(num, den);
    expect(result[0]?.pods[0]?.series).toEqual([{ t: 110, v: 40 }]);
  });

  it("returns an empty pod series when the denominator has no series for that pod", () => {
    const num = [app("a", [podSeries("a-1", [[100, 1]])])];
    const den = [app("a", [podSeries("a-2", [[100, 5]])])]; // different pod
    const result = combineRatioSeriesByApp(num, den);
    expect(result[0]?.pods[0]).toEqual({ pod: "a-1", series: [] });
  });

  it("returns an empty pods[] when the denominator app is missing entirely", () => {
    const num = [app("a", [podSeries("a-1", [[100, 1]])]), app("b", [podSeries("b-1", [[100, 2]])])];
    const den = [app("a", [podSeries("a-1", [[100, 4]])])];
    const result = combineRatioSeriesByApp(num, den);
    expect(result.find((r) => r.app === "b")?.pods[0]).toEqual({ pod: "b-1", series: [] });
  });

  it("drops points with non-finite numerator or denominator", () => {
    const num = [
      app("a", [
        podSeries("a-1", [
          [100, NaN],
          [110, Infinity],
          [120, 3],
        ]),
      ]),
    ];
    const den = [
      app("a", [
        podSeries("a-1", [
          [100, 2],
          [110, 4],
          [120, 6],
        ]),
      ]),
    ];
    const result = combineRatioSeriesByApp(num, den);
    expect(result[0]?.pods[0]?.series).toEqual([{ t: 120, v: 50 }]);
  });

  it("preserves the order of `numerator`'s apps and pods in the output", () => {
    const num = [
      app("c", [podSeries("c-2", [[100, 1]]), podSeries("c-1", [[100, 1]])]),
      app("a", [podSeries("a-1", [[100, 1]])]),
    ];
    const den = [
      app("a", [podSeries("a-1", [[100, 2]])]),
      app("c", [podSeries("c-1", [[100, 2]]), podSeries("c-2", [[100, 2]])]),
    ];
    const result = combineRatioSeriesByApp(num, den);
    expect(result.map((r) => r.app)).toEqual(["c", "a"]);
    expect(result[0]?.pods.map((p) => p.pod)).toEqual(["c-2", "c-1"]);
  });
});
