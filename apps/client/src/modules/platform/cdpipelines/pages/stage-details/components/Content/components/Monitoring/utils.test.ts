import { describe, expect, it } from "vitest";
import type { MetricSeriesByApp } from "@my-project/shared";
import {
  chartSlug,
  computeUtilization,
  formatChartTimestamp,
  formatPercent,
  formatValue,
  humanBytes,
  latestSumByApp,
} from "./utils";

const series = (app: string, values: number[]): MetricSeriesByApp => ({
  app,
  series: values.map((v, i) => ({ t: 1700000000 + i * 60, v })),
});

describe("humanBytes", () => {
  it("returns '0' for non-finite input or values <= 0", () => {
    expect(humanBytes(0)).toBe("0");
    expect(humanBytes(-1)).toBe("0");
    expect(humanBytes(NaN)).toBe("0");
    expect(humanBytes(Infinity)).toBe("0");
  });

  it("renders sub-1-byte values in B without 'undefined' unit (regression for Math.log < 0)", () => {
    // Regression: a previous version computed Math.floor(Math.log(v) / Math.log(1024))
    // without clamping, yielding -1 for 0 < v < 1 and rendering "0.5 undefined".
    expect(humanBytes(0.5)).toBe("1 B");
    expect(humanBytes(0.999)).toBe("1 B");
  });

  it("uses no decimals for whole-byte values", () => {
    expect(humanBytes(1)).toBe("1 B");
    expect(humanBytes(512)).toBe("512 B");
    expect(humanBytes(1023)).toBe("1023 B");
  });

  it("scales to KiB / MiB / GiB / TiB with one decimal", () => {
    expect(humanBytes(1024)).toBe("1.0 KiB");
    expect(humanBytes(1536)).toBe("1.5 KiB");
    expect(humanBytes(1024 * 1024)).toBe("1.0 MiB");
    expect(humanBytes(1024 * 1024 * 1024)).toBe("1.0 GiB");
    expect(humanBytes(1024 ** 4)).toBe("1.0 TiB");
  });

  it("clamps to TiB for values larger than the largest unit", () => {
    expect(humanBytes(1024 ** 5)).toBe("1024.0 TiB");
  });
});

describe("formatValue", () => {
  it("renders cores with two decimals", () => {
    expect(formatValue("cores", 0)).toBe("0.00");
    expect(formatValue("cores", 1.2345)).toBe("1.23");
  });

  it("renders MiB by dividing bytes and rounding", () => {
    expect(formatValue("MiB", 0)).toBe("0");
    expect(formatValue("MiB", 1024 * 1024)).toBe("1");
    expect(formatValue("MiB", 1.5 * 1024 * 1024)).toBe("2");
  });

  it("renders bytes/s using humanBytes with a /s suffix", () => {
    expect(formatValue("bytes/s", 0)).toBe("0/s");
    expect(formatValue("bytes/s", 1024)).toBe("1.0 KiB/s");
    expect(formatValue("bytes/s", 0.5)).toBe("1 B/s");
  });

  it("rounds count and events to integers", () => {
    expect(formatValue("count", 1.4)).toBe("1");
    expect(formatValue("count", 1.6)).toBe("2");
    expect(formatValue("events", 0)).toBe("0");
    expect(formatValue("events", 3.9)).toBe("4");
  });

  it("renders percent values with formatPercent precision tiers and a % suffix", () => {
    expect(formatValue("percent", 0)).toBe("0.00%");
    expect(formatValue("percent", 9.18)).toBe("9.18%");
    expect(formatValue("percent", 52.9)).toBe("52.9%");
    expect(formatValue("percent", 100)).toBe("100%");
    expect(formatValue("percent", 137)).toBe("137%");
  });
});

describe("formatChartTimestamp", () => {
  it("formats unix-seconds via toLocaleTimeString", () => {
    const result = formatChartTimestamp(1700000000);
    // Output is locale/timezone-dependent; assert it's a non-empty time-like string.
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
    expect(result).toBe(new Date(1700000000 * 1000).toLocaleTimeString());
  });
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
    const data = [series("a", [3]), { app: "b", series: [] }];
    expect(latestSumByApp(data, new Set(["a", "b"]))).toBe(3);
  });

  it("returns 0 when nothing matches", () => {
    expect(latestSumByApp([], new Set(["a"]))).toBe(0);
    expect(latestSumByApp([series("a", [1])], new Set())).toBe(0);
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
      { app: "a", series: [] },
      { app: "b", series: [] },
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
});

describe("formatPercent", () => {
  it("uses two decimals below 10", () => {
    expect(formatPercent(0)).toBe("0.00");
    expect(formatPercent(9.18)).toBe("9.18");
  });

  it("uses one decimal between 10 and 100", () => {
    expect(formatPercent(52.9)).toBe("52.9");
    expect(formatPercent(99.95)).toBe("100.0");
  });

  it("uses zero decimals at or above 100", () => {
    expect(formatPercent(100)).toBe("100");
    expect(formatPercent(250.7)).toBe("251");
  });

  it("falls back to '0' for non-finite input", () => {
    expect(formatPercent(NaN)).toBe("0");
    expect(formatPercent(Infinity)).toBe("0");
  });
});

describe("chartSlug", () => {
  it("lowercases and replaces non-alphanumerics with single hyphens", () => {
    expect(chartSlug("CPU usage")).toBe("cpu-usage");
    expect(chartSlug("Memory (working set)")).toBe("memory-working-set");
    expect(chartSlug("Disk I/O Bytes")).toBe("disk-i-o-bytes");
  });

  it("strips leading and trailing hyphens", () => {
    expect(chartSlug("  Hello  ")).toBe("hello");
    expect(chartSlug("__title__")).toBe("title");
  });

  it("handles already-slug-friendly input unchanged", () => {
    expect(chartSlug("oom-events")).toBe("oom-events");
  });
});
