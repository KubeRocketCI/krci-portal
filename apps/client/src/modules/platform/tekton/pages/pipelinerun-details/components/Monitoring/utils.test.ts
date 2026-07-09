import { describe, expect, it } from "vitest";
import type { PipelineRunMetricsOutput, TaskMetricSeries } from "@my-project/shared";
import type { PipelineRunTaskData } from "../../hooks/types";
import {
  collectTaskPods,
  formatCpuSeconds,
  formatDurationShort,
  isAllEmpty,
  peakValue,
  taskHasSamples,
  taskSeriesToChartData,
  totalCpuSeconds,
  toUnixSeconds,
} from "./utils";

const taskData = (podName?: string): PipelineRunTaskData =>
  ({
    pipelineRunTask: { name: "irrelevant" },
    task: undefined,
    taskRun: podName ? ({ status: { podName } } as PipelineRunTaskData["taskRun"]) : undefined,
    approvalTask: undefined,
  }) as PipelineRunTaskData;

const entry = (task: string, steps: Array<{ step: string; values: Array<[number, number]> }>): TaskMetricSeries => ({
  task,
  pod: `${task}-pod`,
  steps: steps.map(({ step, values }) => ({ step, series: values.map(([t, v]) => ({ t, v })) })),
});

const output = (overrides: Partial<PipelineRunMetricsOutput> = {}): PipelineRunMetricsOutput => ({
  cpu: [],
  memory: [],
  cpuThrottling: [],
  start: 0,
  end: 100,
  step: 15,
  queriedAt: 100,
  ...overrides,
});

describe("collectTaskPods", () => {
  it("collects pod refs in map insertion (execution) order and skips tasks without pods", () => {
    const map = new Map<string, PipelineRunTaskData>([
      ["build", taskData("run-build-pod")],
      ["approval", taskData(undefined)],
      ["test", taskData("run-test-pod")],
    ]);
    expect(collectTaskPods(map)).toEqual([
      { podName: "run-build-pod", task: "build" },
      { podName: "run-test-pod", task: "test" },
    ]);
  });

  it("returns empty for an empty map", () => {
    expect(collectTaskPods(new Map())).toEqual([]);
  });
});

describe("toUnixSeconds", () => {
  it("parses ISO timestamps to unix seconds", () => {
    expect(toUnixSeconds("2026-01-01T00:00:00Z")).toBe(1767225600);
  });

  it("returns undefined for missing or invalid input", () => {
    expect(toUnixSeconds(undefined)).toBeUndefined();
    expect(toUnixSeconds("not-a-date")).toBeUndefined();
  });
});

describe("taskSeriesToChartData", () => {
  it("maps a task entry to one chart group with a line per step", () => {
    const data = taskSeriesToChartData(
      entry("build", [
        { step: "compile", values: [[100, 0.5]] },
        { step: "push", values: [[100, 0.1]] },
      ])
    );
    expect(data).toEqual([
      {
        app: "build",
        pods: [
          { pod: "compile", series: [{ t: 100, v: 0.5 }] },
          { pod: "push", series: [{ t: 100, v: 0.1 }] },
        ],
      },
    ]);
  });

  it("returns empty for a missing entry", () => {
    expect(taskSeriesToChartData(undefined)).toEqual([]);
  });
});

describe("isAllEmpty / taskHasSamples", () => {
  it("detects a fully empty result", () => {
    const data = output({
      cpu: [entry("build", [{ step: "compile", values: [] }])],
      memory: [entry("build", [])],
    });
    expect(isAllEmpty(data)).toBe(true);
  });

  it("detects samples in any metric", () => {
    const data = output({ memory: [entry("build", [{ step: "compile", values: [[100, 1]] }])] });
    expect(isAllEmpty(data)).toBe(false);
    expect(taskHasSamples(data, "build")).toBe(true);
    expect(taskHasSamples(data, "test")).toBe(false);
  });
});

describe("totalCpuSeconds", () => {
  it("integrates rate samples over the step interval across tasks and steps", () => {
    const cpu = [
      entry("build", [
        {
          step: "compile",
          values: [
            [100, 0.5],
            [130, 1],
          ],
        },
      ]),
      entry("test", [{ step: "unit", values: [[100, 0.1]] }]),
    ];
    // (0.5 + 1 + 0.1) * 30
    expect(totalCpuSeconds(cpu, 30)).toBeCloseTo(48);
  });

  it("returns null with no samples", () => {
    expect(totalCpuSeconds([entry("build", [{ step: "compile", values: [] }])], 30)).toBeNull();
  });
});

describe("peakValue", () => {
  it("returns the max across all tasks and steps", () => {
    const series = [
      entry("build", [
        {
          step: "compile",
          values: [
            [100, 5],
            [130, 9],
          ],
        },
      ]),
      entry("test", [{ step: "unit", values: [[100, 7]] }]),
    ];
    expect(peakValue(series)).toBe(9);
  });

  it("returns null with no samples", () => {
    expect(peakValue([])).toBeNull();
    expect(peakValue([entry("build", [])])).toBeNull();
  });
});

describe("formatDurationShort", () => {
  it("formats seconds, minutes and hours compactly", () => {
    expect(formatDurationShort(45)).toBe("45s");
    expect(formatDurationShort(204)).toBe("3m 24s");
    expect(formatDurationShort(180)).toBe("3m");
    expect(formatDurationShort(3720)).toBe("1h 2m");
    expect(formatDurationShort(7200)).toBe("2h");
  });

  it("clamps negatives to zero", () => {
    expect(formatDurationShort(-5)).toBe("0s");
  });
});

describe("formatCpuSeconds", () => {
  it("keeps one decimal below a minute and falls back to duration formatting above", () => {
    expect(formatCpuSeconds(12.34)).toBe("12.3s");
    expect(formatCpuSeconds(204)).toBe("3m 24s");
  });
});
