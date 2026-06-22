import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetPipelines = vi.fn();

vi.mock("../../../../clients/gitfusion/index.js", () => ({
  createGitFusionClient: () => ({
    getPipelines: mockGetPipelines,
  }),
}));

describe("gitfusion.getPipelineList", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return pipeline list", async () => {
    const mockResponse = {
      data: [
        {
          id: "5",
          ref: "main",
          sha: "abc123",
          status: "success",
          web_url: "https://gitlab/-/pipelines/5",
          created_at: "2026-06-20T08:09:09Z",
        },
      ],
      pagination: { page: 1, per_page: 20, total: 1 },
    };
    mockGetPipelines.mockResolvedValueOnce(mockResponse);

    const caller = createCaller(mockContext);
    const result = await caller.gitfusion.getPipelineList({
      clusterName: "cluster",
      namespace: "ns",
      gitServer: "gitlab",
      project: "krci/my-app",
    });

    expect(result).toEqual(mockResponse);
    expect(mockGetPipelines).toHaveBeenCalledWith("gitlab", "krci/my-app", {
      ref: undefined,
      status: undefined,
      page: undefined,
      perPage: undefined,
    });
  });

  it("should forward ref/status/pagination filters", async () => {
    mockGetPipelines.mockResolvedValueOnce({ data: [], pagination: { page: 2, per_page: 10, total: 0 } });

    const caller = createCaller(mockContext);
    await caller.gitfusion.getPipelineList({
      clusterName: "cluster",
      namespace: "ns",
      gitServer: "gitlab",
      project: "krci/my-app",
      ref: "main",
      status: "running",
      page: 2,
      perPage: 10,
    });

    expect(mockGetPipelines).toHaveBeenCalledWith("gitlab", "krci/my-app", {
      ref: "main",
      status: "running",
      page: 2,
      perPage: 10,
    });
  });
});
