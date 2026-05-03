import { describe, expect, it } from "vitest";
import {
  escapeRegex,
  groupPodsByApp,
  buildPromQLQueries,
  buildPodPhaseQuery,
  combineRatioSeriesByApp,
  deriveRateWindow,
  matrixToSeriesByApp,
  vectorToPodPhaseByApp,
} from "./utils.js";

const DEFAULT_BUILD_PARAMS = { lookbackWindow: "300s" } as const;

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
  const queries = buildPromQLQueries({ namespace: "ns", podNames: ["pod-a", "pod-b"], ...DEFAULT_BUILD_PARAMS });

  it.each([
    [
      "cpu",
      'rate(container_cpu_usage_seconds_total{namespace="ns", pod=~"^(pod-a|pod-b)$", container!="", container!="POD"}[300s])',
    ],
    [
      "memory",
      'container_memory_working_set_bytes{namespace="ns", pod=~"^(pod-a|pod-b)$", container!="", container!="POD"}',
    ],
    ["memoryRss", 'container_memory_rss{namespace="ns", pod=~"^(pod-a|pod-b)$", container!="", container!="POD"}'],
    ["memoryCache", 'container_memory_cache{namespace="ns", pod=~"^(pod-a|pod-b)$", container!="", container!="POD"}'],
    ["restarts", 'increase(kube_pod_container_status_restarts_total{namespace="ns", pod=~"^(pod-a|pod-b)$"}[300s])'],
    ["networkRx", 'rate(container_network_receive_bytes_total{namespace="ns", pod=~"^(pod-a|pod-b)$"}[300s])'],
    ["networkTx", 'rate(container_network_transmit_bytes_total{namespace="ns", pod=~"^(pod-a|pod-b)$"}[300s])'],
    [
      "diskReadBytes",
      'rate(container_fs_reads_bytes_total{namespace="ns", pod=~"^(pod-a|pod-b)$", container!="", container!="POD"}[300s])',
    ],
    [
      "diskWriteBytes",
      'rate(container_fs_writes_bytes_total{namespace="ns", pod=~"^(pod-a|pod-b)$", container!="", container!="POD"}[300s])',
    ],
    ["oomEvents", 'increase(container_oom_events_total{namespace="ns", pod=~"^(pod-a|pod-b)$"}[300s])'],
    ["cpuRequests", 'kube_pod_container_resource_requests{namespace="ns", pod=~"^(pod-a|pod-b)$", resource="cpu"}'],
    ["cpuLimits", 'kube_pod_container_resource_limits{namespace="ns", pod=~"^(pod-a|pod-b)$", resource="cpu"}'],
    [
      "memoryRequests",
      'kube_pod_container_resource_requests{namespace="ns", pod=~"^(pod-a|pod-b)$", resource="memory"}',
    ],
    ["memoryLimits", 'kube_pod_container_resource_limits{namespace="ns", pod=~"^(pod-a|pod-b)$", resource="memory"}'],
    [
      "cpuThrottledPeriods",
      'rate(container_cpu_cfs_throttled_periods_total{namespace="ns", pod=~"^(pod-a|pod-b)$", container!="", container!="POD"}[300s])',
    ],
    [
      "cpuPeriods",
      'rate(container_cpu_cfs_periods_total{namespace="ns", pod=~"^(pod-a|pod-b)$", container!="", container!="POD"}[300s])',
    ],
  ])("emits the expected PromQL fragment for %s", (key, fragment) => {
    expect(queries[key as keyof typeof queries]).toContain(fragment);
  });

  it("escapes regex meta-characters in pod names", () => {
    const q = buildPromQLQueries({
      namespace: "ns",
      podNames: ["good-pod", "weird.pod"],
      ...DEFAULT_BUILD_PARAMS,
    });
    expect(q.cpu).toContain('pod=~"^(good-pod|weird\\.pod)$"');
  });

  it("anchors the pod regex to prevent prefix-match ambiguity", () => {
    const q = buildPromQLQueries({ namespace: "ns", podNames: ["web"], ...DEFAULT_BUILD_PARAMS });
    expect(q.cpu).toContain('pod=~"^(web)$"');
  });

  it("wraps every metric in `sum by (pod) (...)` (regression guard for aggregation)", () => {
    const all = buildPromQLQueries({ namespace: "ns", podNames: ["pod-a"], ...DEFAULT_BUILD_PARAMS });
    for (const [key, value] of Object.entries(all)) {
      expect(value, `query ${key}`).toMatch(/^sum by \(pod\) \(/);
      expect(value, `query ${key}`).toMatch(/\)$/);
    }
  });

  it("scales rate window with the requested step", () => {
    const fast = buildPromQLQueries({
      namespace: "ns",
      podNames: ["p"],
      lookbackWindow: deriveRateWindow(15),
    });
    expect(fast.cpu).toContain("[300s]");
    const slow = buildPromQLQueries({
      namespace: "ns",
      podNames: ["p"],
      lookbackWindow: deriveRateWindow(300),
    });
    expect(slow.cpu).toContain("[1200s]");
  });

  it("uses increase() with the rate window (bounded trailing interval, not the full range)", () => {
    // Regression: a previous version evaluated increase() over the full
    // selected range, so every datapoint counted events from t=start to T.
    // A single restart then appeared as a rising plateau across the chart.
    // Using the rate window keeps each datapoint's lookback bounded.
    const q = buildPromQLQueries({
      namespace: "ns",
      podNames: ["p"],
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
          { metric: { pod: "api-1" }, values: [[100, "3.0"]] as Array<[number, string]> },
        ],
      },
    };
    const known = ["frontend", "api", "worker"];
    const result = matrixToSeriesByApp(matrix, podToApp, known);

    expect(result.find((r) => r.app === "frontend")?.series).toEqual([
      { t: 100, v: 1.5 },
      { t: 110, v: 2.5 },
    ]);
    expect(result.find((r) => r.app === "api")?.series).toEqual([{ t: 100, v: 3.0 }]);
    expect(result.find((r) => r.app === "worker")?.series).toEqual([]);
  });
  it("aggregates partial-timestamp coverage", () => {
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
          { metric: { pod: "frontend-2" }, values: [[100, "0.5"]] as Array<[number, string]> },
        ],
      },
    };
    const result = matrixToSeriesByApp(matrix, podToApp, ["frontend"]);
    expect(result[0]?.series).toEqual([
      { t: 100, v: 1.5 },
      { t: 110, v: 2.0 },
    ]);
  });
  it("drops NaN and empty string values silently", () => {
    const podToApp = new Map<string, string>([["p1", "app"]]);
    const matrix = {
      status: "success" as const,
      data: {
        resultType: "matrix" as const,
        result: [
          {
            metric: { pod: "p1" },
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
    const result = matrixToSeriesByApp(matrix, podToApp, ["app"]);
    expect(result[0]?.series).toEqual([
      { t: 110, v: 1.0 },
      { t: 130, v: 2.5 },
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
  const series = (app: string, points: Array<[number, number]>) => ({
    app,
    series: points.map(([t, v]) => ({ t, v })),
  });

  it("emits 100 * num/den at every timestamp where both have a finite, positive denominator", () => {
    const num = [series("a", [[100, 2]]), series("b", [[100, 1]])];
    const den = [series("a", [[100, 10]]), series("b", [[100, 4]])];
    const result = combineRatioSeriesByApp(num, den);
    expect(result.find((r) => r.app === "a")?.series).toEqual([{ t: 100, v: 20 }]);
    expect(result.find((r) => r.app === "b")?.series).toEqual([{ t: 100, v: 25 }]);
  });

  it("drops timestamps where the denominator is zero or negative (avoids div-by-zero / nonsense ratios)", () => {
    const num = [
      series("a", [
        [100, 1],
        [110, 2],
        [120, 3],
      ]),
    ];
    const den = [
      series("a", [
        [100, 0],
        [110, 5],
        [120, -1],
      ]),
    ];
    const result = combineRatioSeriesByApp(num, den);
    expect(result[0]?.series).toEqual([{ t: 110, v: 40 }]);
  });

  it("returns an empty series when the denominator series for an app is empty", () => {
    const num = [series("a", [[100, 1]])];
    const den = [{ app: "a", series: [] }];
    const result = combineRatioSeriesByApp(num, den);
    expect(result[0]?.series).toEqual([]);
  });

  it("drops numerator timestamps that have no matching denominator timestamp", () => {
    const num = [
      series("a", [
        [100, 1],
        [110, 2],
      ]),
    ];
    const den = [series("a", [[110, 5]])];
    const result = combineRatioSeriesByApp(num, den);
    expect(result[0]?.series).toEqual([{ t: 110, v: 40 }]);
  });

  it("returns an empty series when an app is missing from the denominator entirely", () => {
    const num = [series("a", [[100, 1]]), series("b", [[100, 2]])];
    const den = [series("a", [[100, 4]])];
    const result = combineRatioSeriesByApp(num, den);
    expect(result.find((r) => r.app === "b")?.series).toEqual([]);
  });

  it("drops points with non-finite numerator or denominator values", () => {
    const num = [
      series("a", [
        [100, NaN],
        [110, Infinity],
        [120, 3],
      ]),
    ];
    const den = [
      series("a", [
        [100, 2],
        [110, 4],
        [120, 6],
      ]),
    ];
    const result = combineRatioSeriesByApp(num, den);
    expect(result[0]?.series).toEqual([{ t: 120, v: 50 }]);
  });

  it("preserves the order of `numerator`'s apps in the output", () => {
    const num = [series("c", [[100, 1]]), series("a", [[100, 1]]), series("b", [[100, 1]])];
    const den = [series("a", [[100, 2]]), series("b", [[100, 2]]), series("c", [[100, 2]])];
    const result = combineRatioSeriesByApp(num, den);
    expect(result.map((r) => r.app)).toEqual(["c", "a", "b"]);
  });
});
