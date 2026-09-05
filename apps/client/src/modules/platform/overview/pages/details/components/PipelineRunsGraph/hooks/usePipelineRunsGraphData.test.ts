import { describe, expect, test, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { PipelineRun, tektonResultAnnotations } from "@my-project/shared";

const usePipelineRunWatchListMock = vi.fn();
vi.mock("@/k8s/api/groups/Tekton/PipelineRun", () => ({
  usePipelineRunWatchList: (params: unknown) => usePipelineRunWatchListMock(params),
}));

import { usePipelineRunsGraphData } from "./usePipelineRunsGraphData";

const makeRun = (status?: string, reason?: string, opts?: { archived?: boolean }): PipelineRun =>
  ({
    metadata: {
      name: "x",
      namespace: "ns",
      labels: {},
      annotations: opts?.archived ? { [tektonResultAnnotations.historySource]: "true" } : {},
    },
    spec: {},
    status: status === undefined ? {} : { conditions: [{ type: "Succeeded", status, reason }] },
  }) as unknown as PipelineRun;

describe("usePipelineRunsGraphData", () => {
  test("buckets one run per phase, folds cancelling into cancelled, and counts a no-conditions run as in-progress", () => {
    const runs = [
      makeRun("Unknown", "Running"), // in-progress
      makeRun("Unknown", "CancelledRunningFinally"), // cancelling
      makeRun("False", "Cancelled"), // cancelled
      makeRun("True"), // succeeded
      makeRun("False", "Failed"), // failed
      makeRun("Unknown", undefined, { archived: true }), // archived, unknown
      makeRun(undefined), // live, no conditions -> in-progress
    ];

    usePipelineRunWatchListMock.mockReturnValue({
      data: { array: runs },
      query: { isFetching: false, data: { items: runs }, error: undefined },
    });

    const { result } = renderHook(() => usePipelineRunsGraphData());

    const { graphData } = result.current;
    expect(graphData.total).toBe(runs.length);
    expect(graphData.inProgress).toBe(2);
    expect(graphData.cancelled).toBe(2);
    expect(graphData.ok).toBe(1);
    expect(graphData.error).toBe(1);
    expect(graphData.unknown).toBe(1);

    // Every run lands in exactly one bucket.
    const bucketSum =
      (graphData.inProgress ?? 0) +
      (graphData.cancelled ?? 0) +
      (graphData.ok ?? 0) +
      (graphData.error ?? 0) +
      (graphData.unknown ?? 0);
    expect(bucketSum).toBe(runs.length);
  });

  test("returns all-null graph data while the watch is still fetching", () => {
    usePipelineRunWatchListMock.mockReturnValue({
      data: { array: [] },
      query: { isFetching: true, data: undefined, error: undefined },
    });

    const { result } = renderHook(() => usePipelineRunsGraphData());

    expect(result.current.graphData.total).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });
});
