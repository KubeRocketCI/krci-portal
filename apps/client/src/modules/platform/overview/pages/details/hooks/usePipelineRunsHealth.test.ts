import { describe, expect, test, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { PipelineRun, tektonResultAnnotations } from "@my-project/shared";

const usePipelineRunWatchListMock = vi.fn();
vi.mock("@/k8s/api/groups/Tekton/PipelineRun", () => ({
  usePipelineRunWatchList: (params: unknown) => usePipelineRunWatchListMock(params),
}));

import { usePipelineRunsHealth } from "./usePipelineRunsHealth";

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

describe("usePipelineRunsHealth", () => {
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
      isLoading: false,
      error: null,
      query: { data: { items: runs } },
    });

    const { result } = renderHook(() => usePipelineRunsHealth());

    const { counts } = result.current;
    if (counts.total === null) {
      throw new Error("expected loaded graph data");
    }

    expect(counts.total).toBe(runs.length);
    expect(counts.inProgress).toBe(2);
    expect(counts.cancelled).toBe(2);
    expect(counts.ok).toBe(1);
    expect(counts.error).toBe(1);
    expect(counts.unknown).toBe(1);
  });

  test("reports no total during the initial fetch", () => {
    usePipelineRunWatchListMock.mockReturnValue({
      data: { array: [] },
      isLoading: true,
      error: null,
      query: { data: undefined },
    });

    const { result } = renderHook(() => usePipelineRunsHealth());

    expect(result.current.counts.total).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });

  test("keeps its counts while a background refetch is in flight", () => {
    const runs = [makeRun("True")];

    usePipelineRunWatchListMock.mockReturnValue({
      data: { array: runs },
      isLoading: false,
      error: null,
      query: { data: { items: runs }, isFetching: true },
    });

    const { result } = renderHook(() => usePipelineRunsHealth());

    expect(result.current.counts.total).toBe(1);
    expect(result.current.isLoading).toBe(false);
  });

  test("surfaces the watch error so the tile can show it instead of a false zero", () => {
    const error = new Error("watch failed");

    usePipelineRunWatchListMock.mockReturnValue({
      data: { array: [] },
      isLoading: false,
      error,
      query: { data: undefined },
    });

    const { result } = renderHook(() => usePipelineRunsHealth());

    expect(result.current.error).toBe(error);
    expect(result.current.counts.total).toBeNull();
  });
});
