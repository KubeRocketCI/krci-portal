import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockTriggerPipeline = vi.fn();

vi.mock("../../../../clients/gitfusion/index.js", () => ({
  createGitFusionClient: () => ({
    triggerPipeline: mockTriggerPipeline,
  }),
}));

describe("gitfusion.triggerGitLabPipeline", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should trigger pipeline with variables", async () => {
    const mockResponse = { id: 123, status: "created" };
    mockTriggerPipeline.mockResolvedValueOnce(mockResponse);

    const caller = createCaller(mockContext);
    const result = await caller.gitfusion.triggerGitLabPipeline({
      clusterName: "cluster",
      namespace: "ns",
      gitServer: "gitlab",
      project: "my-project",
      ref: "main",
      variables: [{ key: "ENV", value: "staging" }],
    });

    expect(result).toEqual(mockResponse);
    expect(mockTriggerPipeline).toHaveBeenCalledWith("gitlab", "my-project", "main", [
      { key: "ENV", value: "staging" },
    ]);
  });

  it("should trigger pipeline without variables", async () => {
    mockTriggerPipeline.mockResolvedValueOnce({ id: 456 });

    const caller = createCaller(mockContext);
    await caller.gitfusion.triggerGitLabPipeline({
      clusterName: "cluster",
      namespace: "ns",
      gitServer: "gitlab",
      project: "my-project",
      ref: "main",
    });

    expect(mockTriggerPipeline).toHaveBeenCalledWith("gitlab", "my-project", "main", undefined);
  });
});
