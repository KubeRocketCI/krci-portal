import { K8sApiError, k8sPipelineRunConfig } from "@my-project/shared";
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { stopPipelineRuns, type PipelineRunStopClient } from "./stopPipelineRuns.js";

const runningRun = {
  metadata: { name: "run-a", namespace: "ns" },
  spec: {},
  status: { conditions: [{ type: "Succeeded", status: "Unknown", reason: "Running" }] },
};

const succeededRun = {
  metadata: { name: "run-a", namespace: "ns" },
  spec: {},
  status: { conditions: [{ type: "Succeeded", status: "True", reason: "Succeeded" }] },
};

const stoppingRun = {
  metadata: { name: "run-a", namespace: "ns" },
  spec: { status: "CancelledRunFinally" },
  status: { conditions: [{ type: "Succeeded", status: "Unknown", reason: "Running" }] },
};

const runA = { namespace: "ns", name: "run-a" };

describe("stopPipelineRuns", () => {
  let getResource: Mock;
  let patchResource: Mock;
  let k8sClient: PipelineRunStopClient;

  beforeEach(() => {
    getResource = vi.fn();
    patchResource = vi.fn().mockResolvedValue({});
    k8sClient = { getResource, patchResource } as unknown as PipelineRunStopClient;
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("merge-patches a running run to CancelledRunFinally with the user-cancelled reason", async () => {
    getResource.mockResolvedValue(runningRun);

    const results = await stopPipelineRuns(k8sClient, [runA]);

    expect(results).toEqual([{ ...runA, result: "stopping" }]);
    expect(getResource).toHaveBeenCalledWith(k8sPipelineRunConfig, "run-a", "ns");
    expect(patchResource).toHaveBeenCalledWith(
      k8sPipelineRunConfig,
      "run-a",
      "ns",
      {
        metadata: { annotations: { "app.edp.epam.com/queue-cancel-reason": "user-cancelled" } },
        spec: { status: "CancelledRunFinally" },
      },
      "merge"
    );
  });

  it.each([
    ["finished", succeededRun, "already_done"],
    ["already stopping", stoppingRun, "already_stopping"],
  ])("skips a %s run without patching it", async (_, liveRun, reason) => {
    getResource.mockResolvedValue(liveRun);

    const results = await stopPipelineRuns(k8sClient, [runA]);

    expect(results).toEqual([{ ...runA, result: "skipped", reason }]);
    expect(patchResource).not.toHaveBeenCalled();
  });

  it("skips a run that is gone before the GET", async () => {
    getResource.mockRejectedValue(new K8sApiError(404, "Not Found", ""));

    expect(await stopPipelineRuns(k8sClient, [runA])).toEqual([{ ...runA, result: "skipped", reason: "not_found" }]);
  });

  it("re-reads a run whose patch is rejected and skips it once it has finished", async () => {
    getResource.mockResolvedValueOnce(runningRun).mockResolvedValueOnce(succeededRun);
    patchResource.mockRejectedValue(new K8sApiError(400, "Bad Request", "admission webhook denied the request"));

    expect(await stopPipelineRuns(k8sClient, [runA])).toEqual([{ ...runA, result: "skipped", reason: "already_done" }]);
    expect(getResource).toHaveBeenCalledTimes(2);
  });

  it.each([
    [
      "the run was deleted after the GET",
      new K8sApiError(404, "Not Found", ""),
      { result: "skipped", reason: "not_found" },
    ],
    ["the user may not patch it", new K8sApiError(403, "Forbidden", ""), { result: "failed", reason: "forbidden" }],
    [
      "the API server rejects the token",
      new K8sApiError(401, "Unauthorized", ""),
      { result: "failed", reason: "forbidden" },
    ],
    [
      "the patch is rejected for another reason",
      new K8sApiError(400, "Bad Request", "invalid"),
      { result: "failed", reason: "error" },
    ],
    ["the API server fails", new K8sApiError(500, "Internal Server Error", ""), { result: "failed", reason: "error" }],
    ["the request throws a non-API error", new Error("socket hang up"), { result: "failed", reason: "error" }],
  ])("reports the PATCH outcome when %s", async (_, error, outcome) => {
    getResource.mockResolvedValue(runningRun);
    patchResource.mockRejectedValue(error);

    expect(await stopPipelineRuns(k8sClient, [runA])).toEqual([{ ...runA, ...outcome }]);
  });

  it("returns one outcome per unique run in input order and keeps going after a failure", async () => {
    getResource.mockImplementation((_config, name: string) =>
      name === "run-b" ? Promise.reject(new K8sApiError(403, "Forbidden", "")) : Promise.resolve(runningRun)
    );

    const results = await stopPipelineRuns(k8sClient, [
      runA,
      { namespace: "ns", name: "run-b" },
      { namespace: "other", name: "run-a" },
      runA,
    ]);

    expect(results).toEqual([
      { ...runA, result: "stopping" },
      { namespace: "ns", name: "run-b", result: "failed", reason: "forbidden" },
      { namespace: "other", name: "run-a", result: "stopping" },
    ]);
    expect(getResource).toHaveBeenCalledTimes(3);
  });
});
