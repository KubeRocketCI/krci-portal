import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetJobTrace = vi.fn();

vi.mock("../../../../clients/gitfusion/index.js", () => ({
  createGitFusionClient: () => ({
    getJobTrace: mockGetJobTrace,
  }),
}));

describe("gitfusion.getPipelineJobTrace", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return the job trace", async () => {
    const mockResponse = { job_id: "23", content: "build log output" };
    mockGetJobTrace.mockResolvedValueOnce(mockResponse);

    const caller = createCaller(mockContext);
    const result = await caller.gitfusion.getPipelineJobTrace({
      clusterName: "cluster",
      namespace: "ns",
      gitServer: "gitlab",
      project: "krci/my-app",
      jobId: "23",
    });

    expect(result).toEqual(mockResponse);
    expect(mockGetJobTrace).toHaveBeenCalledWith("gitlab", "krci/my-app", "23");
  });
});
