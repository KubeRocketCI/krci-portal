import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetPipelineJobs = vi.fn();

vi.mock("../../../../clients/gitfusion/index.js", () => ({
  createGitFusionClient: () => ({
    getPipelineJobs: mockGetPipelineJobs,
  }),
}));

describe("gitfusion.getPipelineJobList", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return the pipeline job list", async () => {
    const mockResponse = {
      data: [{ id: "16", name: "build", stage: "build", status: "success" }],
    };
    mockGetPipelineJobs.mockResolvedValueOnce(mockResponse);

    const caller = createCaller(mockContext);
    const result = await caller.gitfusion.getPipelineJobList({
      clusterName: "cluster",
      namespace: "ns",
      gitServer: "gitlab",
      project: "krci/my-app",
      pipelineId: "5",
    });

    expect(result).toEqual(mockResponse);
    expect(mockGetPipelineJobs).toHaveBeenCalledWith("gitlab", "krci/my-app", "5");
  });
});
