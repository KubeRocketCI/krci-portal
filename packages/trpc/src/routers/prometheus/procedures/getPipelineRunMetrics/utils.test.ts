import { describe, expect, it } from "vitest";
import {
  MAX_PIPELINE_RUN_PODS,
  pipelineRunMetricsInputSchema,
  type PromQLMatrixResponse,
  type TaskMetricSeries,
} from "@my-project/shared";
import {
  buildPipelineRunPromQLQueries,
  combineTaskRatioSeries,
  derivePipelineRunRateWindow,
  derivePipelineRunStep,
  matrixToTaskSeries,
} from "./utils.js";

function matrix(result: PromQLMatrixResponse["data"]["result"]): PromQLMatrixResponse {
  return { status: "success", data: { resultType: "matrix", result } };
}

describe("derivePipelineRunStep", () => {
  it("uses the finest step for short runs", () => {
    expect(derivePipelineRunStep(300)).toBe(15);
    expect(derivePipelineRunStep(15 * 300)).toBe(15);
  });

  it("coarsens the step to keep the point count bounded", () => {
    expect(derivePipelineRunStep(15 * 300 + 1)).toBe(30);
    expect(derivePipelineRunStep(6 * 3600)).toBe(120);
  });

  it("falls back to the coarsest step for very long windows", () => {
    expect(derivePipelineRunStep(30 * 86_400)).toBe(3600);
  });
});

describe("derivePipelineRunRateWindow", () => {
  it("floors at 120s for fine steps", () => {
    expect(derivePipelineRunRateWindow(15)).toBe("120s");
    expect(derivePipelineRunRateWindow(30)).toBe("120s");
  });

  it("scales with 4x the step above the floor", () => {
    expect(derivePipelineRunRateWindow(60)).toBe("240s");
    expect(derivePipelineRunRateWindow(300)).toBe("1200s");
  });
});

describe("buildPipelineRunPromQLQueries", () => {
  const queries = buildPipelineRunPromQLQueries({
    namespace: "krci",
    podNames: ["run-build-pod", "run-test-pod"],
    lookbackWindow: "120s",
  });

  it("selects only step containers for the exact pod set", () => {
    for (const query of Object.values(queries)) {
      expect(query).toContain('namespace="krci"');
      expect(query).toContain('pod=~"^(run-build-pod|run-test-pod)$"');
      expect(query).toContain('container=~"^step-.*"');
      expect(query).toContain("sum by (pod, container)");
    }
  });

  it("builds the four expected metrics", () => {
    expect(queries.cpu).toContain("rate(container_cpu_usage_seconds_total");
    expect(queries.memory).toContain("container_memory_working_set_bytes");
    expect(queries.cpuThrottledPeriods).toContain("rate(container_cpu_cfs_throttled_periods_total");
    expect(queries.cpuPeriods).toContain("rate(container_cpu_cfs_periods_total");
  });

  it("regex-escapes pod names defensively", () => {
    const escaped = buildPipelineRunPromQLQueries({
      namespace: "krci",
      podNames: ["weird.pod"],
      lookbackWindow: "120s",
    });
    expect(escaped.cpu).toContain('pod=~"^(weird\\.pod)$"');
  });
});

describe("matrixToTaskSeries", () => {
  const pods = [
    { podName: "run-build-pod", task: "build" },
    { podName: "run-test-pod", task: "test" },
  ];

  it("groups series by pod, strips the step- container prefix, and preserves pod order", () => {
    const out = matrixToTaskSeries(
      matrix([
        {
          metric: { pod: "run-test-pod", container: "step-unit" },
          values: [[100, "1"]],
        },
        {
          metric: { pod: "run-build-pod", container: "step-compile" },
          values: [
            [100, "0.5"],
            [130, "0.7"],
          ],
        },
      ]),
      pods
    );
    expect(out).toEqual([
      {
        task: "build",
        pod: "run-build-pod",
        steps: [
          {
            step: "compile",
            series: [
              { t: 100, v: 0.5 },
              { t: 130, v: 0.7 },
            ],
          },
        ],
      },
      { task: "test", pod: "run-test-pod", steps: [{ step: "unit", series: [{ t: 100, v: 1 }] }] },
    ]);
  });

  it("sorts steps by name so line colors stay stable across refreshes", () => {
    const out = matrixToTaskSeries(
      matrix([
        { metric: { pod: "run-build-pod", container: "step-push" }, values: [[100, "1"]] },
        { metric: { pod: "run-build-pod", container: "step-compile" }, values: [[130, "2"]] },
      ]),
      [pods[0]!]
    );
    expect(out[0]!.steps.map((s) => s.step)).toEqual(["compile", "push"]);
  });

  it("emits every requested task even with no samples", () => {
    const out = matrixToTaskSeries(matrix([]), pods);
    expect(out).toEqual([
      { task: "build", pod: "run-build-pod", steps: [] },
      { task: "test", pod: "run-test-pod", steps: [] },
    ]);
  });

  it("drops rows for unknown pods and non-finite values", () => {
    const out = matrixToTaskSeries(
      matrix([
        { metric: { pod: "other-pod", container: "step-x" }, values: [[100, "1"]] },
        {
          metric: { pod: "run-build-pod", container: "step-compile" },
          values: [
            [100, "NaN"],
            [130, "2"],
          ],
        },
      ]),
      pods
    );
    expect(out[0]!.steps).toEqual([{ step: "compile", series: [{ t: 130, v: 2 }] }]);
    expect(out[1]!.steps).toEqual([]);
  });
});

describe("combineTaskRatioSeries", () => {
  const entry = (pod: string, task: string, series: Array<[number, number]>): TaskMetricSeries => ({
    task,
    pod,
    steps: [{ step: "compile", series: series.map(([t, v]) => ({ t, v })) }],
  });

  it("emits 100 * num / den at shared timestamps only", () => {
    const out = combineTaskRatioSeries(
      [
        entry("p1", "build", [
          [100, 1],
          [130, 3],
          [160, 1],
        ]),
      ],
      [
        entry("p1", "build", [
          [100, 4],
          [130, 4],
        ]),
      ]
    );
    expect(out[0]!.steps[0]!.series).toEqual([
      { t: 100, v: 25 },
      { t: 130, v: 75 },
    ]);
  });

  it("skips zero/negative denominators and emits empty series when the denominator step is missing", () => {
    const out = combineTaskRatioSeries([entry("p1", "build", [[100, 1]])], [entry("p1", "build", [[100, 0]])]);
    expect(out[0]!.steps[0]!.series).toEqual([]);

    const missing = combineTaskRatioSeries(
      [entry("p1", "build", [[100, 1]])],
      [{ task: "build", pod: "p1", steps: [] }]
    );
    expect(missing[0]!.steps[0]!.series).toEqual([]);
  });
});

describe("pipelineRunMetricsInputSchema", () => {
  const base = {
    clusterName: "in-cluster",
    namespace: "krci",
    pods: [{ podName: "run-build-pod", task: "build" }],
    start: 100,
  };

  it("accepts a valid input with and without end", () => {
    expect(pipelineRunMetricsInputSchema.safeParse(base).success).toBe(true);
    expect(pipelineRunMetricsInputSchema.safeParse({ ...base, end: 200 }).success).toBe(true);
  });

  it("rejects end <= start", () => {
    expect(pipelineRunMetricsInputSchema.safeParse({ ...base, end: 100 }).success).toBe(false);
    expect(pipelineRunMetricsInputSchema.safeParse({ ...base, end: 50 }).success).toBe(false);
  });

  it("rejects invalid pod names and namespaces", () => {
    expect(
      pipelineRunMetricsInputSchema.safeParse({ ...base, pods: [{ podName: 'bad"pod', task: "build" }] }).success
    ).toBe(false);
    expect(pipelineRunMetricsInputSchema.safeParse({ ...base, namespace: 'krci"}or' }).success).toBe(false);
  });

  it("rejects empty and oversized pod lists", () => {
    expect(pipelineRunMetricsInputSchema.safeParse({ ...base, pods: [] }).success).toBe(false);
    const tooMany = Array.from({ length: MAX_PIPELINE_RUN_PODS + 1 }, (_, i) => ({
      podName: `pod-${i}`,
      task: `task-${i}`,
    }));
    expect(pipelineRunMetricsInputSchema.safeParse({ ...base, pods: tooMany }).success).toBe(false);
  });
});
