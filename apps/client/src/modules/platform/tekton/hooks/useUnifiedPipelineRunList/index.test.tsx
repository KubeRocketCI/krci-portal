import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { TektonResult } from "@my-project/shared";
import React from "react";
import { createTestQueryClient } from "@/test/utils/query-client";
import { useUnifiedPipelineRunList } from "./index";

const mocks = vi.hoisted(() => ({
  getPipelineRunResults: vi.fn(),
}));

vi.mock("@/k8s/api/groups/Tekton/PipelineRun", () => ({
  usePipelineRunWatchList: () => ({ data: { array: [] }, isReady: true }),
}));

vi.mock("@/core/providers/trpc", () => ({
  useTRPCClient: () => ({ tektonResults: { getPipelineRunResults: { query: mocks.getPipelineRunResults } } }),
}));

vi.mock("@/k8s/store", () => ({
  useClusterStore: (selector: (state: { defaultNamespace: string; clusterName: string }) => unknown) =>
    selector({ defaultNamespace: "krci", clusterName: "kind-krci" }),
}));

const archivedResult: TektonResult = {
  uid: "run-1",
  name: "krci/results/run-1",
  create_time: "2026-10-01T10:00:00Z",
  update_time: "2026-10-01T10:05:00Z",
};

type Options = NonNullable<Parameters<typeof useUnifiedPipelineRunList>[0]>;

function renderUnifiedList(initialOptions: Options) {
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook((options: Options) => useUnifiedPipelineRunList(options), {
    wrapper,
    initialProps: initialOptions,
  });
}

describe("useUnifiedPipelineRunList", () => {
  beforeEach(() => {
    mocks.getPipelineRunResults.mockReset();
    mocks.getPipelineRunResults.mockResolvedValue({ results: [archivedResult], nextPageToken: "next" });
  });

  it("merges archived runs and exposes the next archive page", async () => {
    const { result } = renderUnifiedList({ status: "all" });

    await waitFor(() => expect(result.current.mergedPipelineRuns).toHaveLength(1));
    expect(result.current.historyQuery.hasNextPage).toBe(true);
  });

  it("drops cached history when switching to a status that has none", async () => {
    const { result, rerender } = renderUnifiedList({ status: "all" });
    await waitFor(() => expect(result.current.mergedPipelineRuns).toHaveLength(1));

    rerender({ status: "in-progress" });

    expect(result.current.mergedPipelineRuns).toHaveLength(0);
    expect(result.current.historyQuery.hasNextPage).toBe(false);
    expect(mocks.getPipelineRunResults).toHaveBeenCalledTimes(1);
  });

  it("queries history while the namespace filter includes the default namespace", async () => {
    const { result } = renderUnifiedList({ namespaces: ["krci", "dev"] });

    await waitFor(() => expect(result.current.mergedPipelineRuns).toHaveLength(1));
  });

  it("skips history when the namespace filter excludes the default namespace", async () => {
    const { result, rerender } = renderUnifiedList({});
    await waitFor(() => expect(result.current.mergedPipelineRuns).toHaveLength(1));

    rerender({ namespaces: ["dev"] });

    expect(result.current.mergedPipelineRuns).toHaveLength(0);
    expect(result.current.historyQuery.hasNextPage).toBe(false);
    expect(mocks.getPipelineRunResults).toHaveBeenCalledTimes(1);
  });
});
