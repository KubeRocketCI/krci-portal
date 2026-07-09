import { describe, expect, it } from "vitest";
import type { MetricSeriesByApp } from "@my-project/shared";
import { computeUtilization, latestSumByApp } from "./utils";

const series = (app: string, values: number[]): MetricSeriesByApp => ({
  app,
  pods: [
    {
      pod: `${app}-1`,
      series: values.map((v, i) => ({ t: 1700000000 + i * 60, v })),
    },
  ],
});

const multiPod = (app: string, perPod: number[][]): MetricSeriesByApp => ({
  app,
  pods: perPod.map((values, idx) => ({
    pod: `${app}-${idx + 1}`,
    series: values.map((v, i) => ({ t: 1700000000 + i * 60, v })),
  })),
});

describe("latestSumByApp", () => {
  it("sums the last point of every selected app's series", () => {
    const data = [series("a", [1, 2, 3]), series("b", [10, 20]), series("c", [100])];
    expect(latestSumByApp(data, new Set(["a", "b", "c"]))).toBe(123);
  });

  it("skips apps not in the selection", () => {
    const data = [series("a", [1, 2, 3]), series("b", [10, 20])];
    expect(latestSumByApp(data, new Set(["a"]))).toBe(3);
  });

  it("treats apps with empty series as zero contribution", () => {
    const data = [series("a", [3]), { app: "b", pods: [] }];
    expect(latestSumByApp(data, new Set(["a", "b"]))).toBe(3);
  });

  it("returns 0 when nothing matches", () => {
    expect(latestSumByApp([], new Set(["a"]))).toBe(0);
    expect(latestSumByApp([series("a", [1])], new Set())).toBe(0);
  });

  it("sums the latest sample of every pod under each selected app", () => {
    const data = [
      multiPod("a", [
        [1, 2, 3], // a-1 latest = 3
        [10, 20], // a-2 latest = 20
      ]),
      series("b", [100]),
    ];
    expect(latestSumByApp(data, new Set(["a", "b"]))).toBe(123);
  });

  it("ignores pods within an app when the app is not selected", () => {
    const data = [multiPod("a", [[1], [2]]), multiPod("b", [[3]])];
    expect(latestSumByApp(data, new Set(["a"]))).toBe(3);
  });
});

describe("computeUtilization", () => {
  const apps = new Set(["a", "b"]);

  it("returns Grafana-style percentage (sum usage / sum capacity * 100)", () => {
    const usage = [series("a", [0.3]), series("b", [0.6])];
    const capacity = [series("a", [1]), series("b", [2])];
    // (0.3 + 0.6) / (1 + 2) * 100 = 30
    expect(computeUtilization(usage, capacity, apps)).toBe(30);
  });

  it("returns null when no selected app has capacity configured", () => {
    const usage = [series("a", [0.5]), series("b", [0.5])];
    const capacity = [
      { app: "a", pods: [] },
      { app: "b", pods: [] },
    ];
    expect(computeUtilization(usage, capacity, apps)).toBeNull();
  });

  it("returns null when capacity sums to zero", () => {
    const usage = [series("a", [0.5])];
    const capacity = [series("a", [0])];
    expect(computeUtilization(usage, capacity, apps)).toBeNull();
  });

  it("only counts capacity from apps in the selection", () => {
    const usage = [series("a", [1]), series("b", [1])];
    const capacity = [series("a", [4]), series("b", [4])];
    expect(computeUtilization(usage, capacity, new Set(["a"]))).toBe(25);
  });

  it("can exceed 100% when usage outpaces configured capacity", () => {
    const usage = [series("a", [3])];
    const capacity = [series("a", [2])];
    expect(computeUtilization(usage, capacity, apps)).toBe(150);
  });

  it("rolls up multi-pod usage and capacity by summing all pods of selected apps", () => {
    const usage = [multiPod("a", [[0.2], [0.3]])]; // total 0.5
    const capacity = [multiPod("a", [[1], [1]])]; // total 2
    expect(computeUtilization(usage, capacity, new Set(["a"]))).toBe(25);
  });
});
