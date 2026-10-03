import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { PIPELINE_RUN_STOP_MAX_RUNS, summarizePipelineRunStop, type PipelineRun } from "@my-project/shared";

const stopMock = vi.fn();
vi.mock("@/core/providers/trpc", () => ({
  useTRPCClient: () => ({ pipelineRun: { stop: { mutate: stopMock } } }),
}));
vi.mock("@/core/components/Snackbar", () => ({
  showToast: vi.fn().mockReturnValue("toast-id"),
  dismissToast: vi.fn(),
}));
vi.mock("@/k8s/api/groups/Tekton/PipelineRun", () => ({
  usePipelineRunPermissions: () => ({
    data: { patch: { allowed: false, reason: "You cannot patch pipelineruns" } },
  }),
}));

import { useStopPipelineRuns, type PipelineRunStopOutcome, type UseStopPipelineRunsOptions } from "./index";
import { dismissToast, showToast } from "@/core/components/Snackbar";

const makeRun = (name: string, namespace = "ns") => ({ metadata: { name, namespace } }) as unknown as PipelineRun;

const respond = (results: PipelineRunStopOutcome[]) => ({ results, summary: summarizePipelineRunStop(results) });

const stopAll = async ({ runs }: { runs: { namespace: string; name: string }[] }) =>
  respond(runs.map((ref) => ({ ...ref, result: "stopping" as const })));

function renderStopHook(options?: UseStopPipelineRunsOptions) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  return renderHook(() => useStopPipelineRuns(options), { wrapper });
}

describe("useStopPipelineRuns", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends namespace and name of each run and toasts a single outcome", async () => {
    const output = respond([{ namespace: "ns", name: "run-a", result: "stopping" }]);
    stopMock.mockResolvedValueOnce(output);
    const { result } = renderStopHook();

    let returned;
    await act(async () => {
      returned = await result.current.stop([makeRun("run-a")]);
    });

    expect(stopMock).toHaveBeenCalledWith({ runs: [{ namespace: "ns", name: "run-a" }] });
    expect(returned).toEqual(output);
    expect(showToast).toHaveBeenCalledWith("Stopping PipelineRun run-a…", "loading");
    expect(showToast).toHaveBeenCalledWith(
      "PipelineRun run-a is stopping",
      "success",
      expect.objectContaining({ id: "toast-id" })
    );
  });

  it("splits runs above the request limit into sequential requests and merges the outcomes", async () => {
    const runs = Array.from({ length: PIPELINE_RUN_STOP_MAX_RUNS + 1 }, (_, i) => makeRun(`run-${i}`));
    stopMock.mockImplementation(stopAll);
    const { result } = renderStopHook();

    let returned: Awaited<ReturnType<typeof result.current.stop>>;
    await act(async () => {
      returned = await result.current.stop(runs);
    });

    expect(stopMock).toHaveBeenCalledTimes(2);
    expect(stopMock.mock.calls[0][0].runs).toHaveLength(PIPELINE_RUN_STOP_MAX_RUNS);
    expect(stopMock.mock.calls[1][0].runs).toEqual([{ namespace: "ns", name: `run-${PIPELINE_RUN_STOP_MAX_RUNS}` }]);
    expect(returned!.results).toHaveLength(runs.length);
    expect(returned!.summary).toEqual({ stopping: runs.length, skipped: 0, failed: 0 });
  });

  it("keeps earlier outcomes and fails the rest when a later request fails", async () => {
    const runs = Array.from({ length: PIPELINE_RUN_STOP_MAX_RUNS + 2 }, (_, i) => makeRun(`run-${i}`));
    stopMock.mockImplementationOnce(stopAll).mockRejectedValueOnce(new Error("Service Unavailable"));
    const { result } = renderStopHook();

    let returned: Awaited<ReturnType<typeof result.current.stop>>;
    await act(async () => {
      returned = await result.current.stop(runs);
    });

    expect(returned!.summary).toEqual({ stopping: PIPELINE_RUN_STOP_MAX_RUNS, skipped: 0, failed: 2 });
    expect(returned!.results.slice(-2)).toEqual([
      { namespace: "ns", name: `run-${PIPELINE_RUN_STOP_MAX_RUNS}`, result: "failed", reason: "error" },
      { namespace: "ns", name: `run-${PIPELINE_RUN_STOP_MAX_RUNS + 1}`, result: "failed", reason: "error" },
    ]);
    expect(showToast).toHaveBeenCalledWith(
      `Stopping ${PIPELINE_RUN_STOP_MAX_RUNS} of ${runs.length} PipelineRuns · 2 failed`,
      "warning",
      expect.objectContaining({ id: "toast-id" })
    );
  });

  const stopping = (name: string): PipelineRunStopOutcome => ({ namespace: "ns", name, result: "stopping" });
  const skipped = (name: string): PipelineRunStopOutcome => ({
    namespace: "ns",
    name,
    result: "skipped",
    reason: "already_done",
  });
  const failed = (name: string): PipelineRunStopOutcome => ({
    namespace: "ns",
    name,
    result: "failed",
    reason: "forbidden",
  });

  it.each([
    [
      "warning when some runs failed",
      [stopping("a"), skipped("b"), failed("c")],
      "warning",
      "Stopping 1 of 3 PipelineRuns · 1 skipped · 1 failed",
    ],
    [
      "error when no run is stopping and some failed",
      [failed("a"), failed("b"), failed("c")],
      "error",
      "Stopping 0 of 3 PipelineRuns · 3 failed",
    ],
    [
      "info when every run was skipped",
      [skipped("a"), skipped("b"), skipped("c")],
      "info",
      "Stopping 0 of 3 PipelineRuns · 3 skipped",
    ],
  ])("summarises a batch as %s", async (_, results, severity, message) => {
    stopMock.mockResolvedValueOnce(respond(results));
    const { result } = renderStopHook();

    await act(async () => {
      await result.current.stop([makeRun("a"), makeRun("b"), makeRun("c")]);
    });

    expect(showToast).toHaveBeenCalledWith(message, severity, expect.objectContaining({ id: "toast-id" }));
  });

  it("names the reason when a single run is not stopped", async () => {
    stopMock.mockResolvedValueOnce(respond([failed("run-a")]));
    const { result } = renderStopHook();

    await act(async () => {
      await result.current.stop([makeRun("run-a")]);
    });

    expect(showToast).toHaveBeenCalledWith(
      "Failed to stop PipelineRun run-a: no permission",
      "error",
      expect.objectContaining({ id: "toast-id" })
    );
  });

  it("resolves to undefined with an error toast when the request fails", async () => {
    stopMock.mockRejectedValueOnce(new Error("Bad Request"));
    const { result } = renderStopHook();

    let returned: unknown = "unset";
    await act(async () => {
      returned = await result.current.stop([makeRun("a"), makeRun("b")]);
    });

    expect(returned).toBeUndefined();
    expect(showToast).toHaveBeenCalledWith(
      "Failed to stop 2 PipelineRuns",
      "error",
      expect.objectContaining({ description: "Bad Request" })
    );
  });

  it("resolves to the outcomes and dismisses the loading toast without a summary when report is none", async () => {
    const output = respond([stopping("a"), failed("b")]);
    stopMock.mockResolvedValueOnce(output);
    const { result } = renderStopHook({ report: "none" });

    let returned;
    await act(async () => {
      returned = await result.current.stop([makeRun("a"), makeRun("b")]);
    });

    expect(returned).toEqual(output);
    expect(showToast).toHaveBeenCalledTimes(1);
    expect(showToast).toHaveBeenCalledWith("Stopping 2 PipelineRuns…", "loading");
    expect(dismissToast).toHaveBeenCalledWith("toast-id");
  });

  it("keeps the error toast when report is none and the request fails", async () => {
    stopMock.mockRejectedValueOnce(new Error("Bad Request"));
    const { result } = renderStopHook({ report: "none" });

    let returned: unknown = "unset";
    await act(async () => {
      returned = await result.current.stop([makeRun("a")]);
    });

    expect(returned).toBeUndefined();
    expect(dismissToast).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith(
      "Failed to stop PipelineRun a",
      "error",
      expect.objectContaining({ description: "Bad Request" })
    );
  });

  it("exposes the patch permission", () => {
    const { result } = renderStopHook();

    expect(result.current.permission).toEqual({ allowed: false, reason: "You cannot patch pipelineruns" });
  });
});
