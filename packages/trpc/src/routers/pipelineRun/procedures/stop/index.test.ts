import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { K8sClient } from "../../../../clients/k8s/index.js";
import { PIPELINE_RUN_STOP_MAX_RUNS } from "../../../../schemas/pipelineRunStop.js";

vi.mock("../../../../clients/k8s/index.js", () => ({
  K8sClient: vi.fn(),
}));

const runningRun = {
  metadata: { name: "run-a", namespace: "edp" },
  spec: {},
  status: { conditions: [{ type: "Succeeded", status: "Unknown", reason: "Running" }] },
};

describe("pipelineRun.stop", () => {
  let mockContext: ReturnType<typeof createMockedContext>;
  let mockK8sClientInstance: {
    KubeConfig: object;
    getResource: Mock;
    patchResource: Mock;
  };

  beforeEach(() => {
    mockContext = createMockedContext();
    mockK8sClientInstance = {
      KubeConfig: {},
      getResource: vi.fn().mockResolvedValue(runningRun),
      patchResource: vi.fn().mockResolvedValue({}),
    };
    (K8sClient as unknown as Mock).mockImplementation(function () {
      return mockK8sClientInstance;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("stops the runs with the session client and summarises the outcomes", async () => {
    mockK8sClientInstance.getResource
      .mockResolvedValueOnce(runningRun)
      .mockResolvedValueOnce({ ...runningRun, spec: { status: "CancelledRunFinally" } });

    const caller = createCaller(mockContext);
    const output = await caller.pipelineRun.stop({
      runs: [
        { namespace: "edp", name: "run-a" },
        { namespace: "edp", name: "run-b" },
      ],
    });

    expect(output).toEqual({
      results: [
        { namespace: "edp", name: "run-a", result: "stopping" },
        { namespace: "edp", name: "run-b", result: "skipped", reason: "already_stopping" },
      ],
      summary: { stopping: 1, skipped: 1, failed: 0 },
    });
    expect(K8sClient).toHaveBeenCalledWith(mockContext.session);
    expect(mockK8sClientInstance.patchResource).toHaveBeenCalledTimes(1);
    expect(mockK8sClientInstance.patchResource.mock.calls[0][4]).toBe("merge");
  });

  it.each([
    ["an empty list", { runs: [] }],
    [
      "more than the maximum number of runs",
      {
        runs: Array.from({ length: PIPELINE_RUN_STOP_MAX_RUNS + 1 }, (_, i) => ({
          namespace: "edp",
          name: `run-${i}`,
        })),
      },
    ],
    ["an invalid run name", { runs: [{ namespace: "edp", name: "Run_A" }] }],
    ["an unknown field", { runs: [{ namespace: "edp", name: "run-a", uid: "x" }] }],
  ])("rejects %s with BAD_REQUEST before calling Kubernetes", async (_, input) => {
    const caller = createCaller(mockContext);

    await expect(caller.pipelineRun.stop(input as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mockK8sClientInstance.getResource).not.toHaveBeenCalled();
  });
});
