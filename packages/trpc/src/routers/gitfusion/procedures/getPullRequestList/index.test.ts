import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetPullRequests = vi.fn();

vi.mock("../../../../clients/gitfusion/index.js", () => ({
  createGitFusionClient: () => ({
    getPullRequests: mockGetPullRequests,
  }),
}));

describe("gitfusion.getPullRequestList", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return pull request list", async () => {
    const mockResponse = [{ id: 1, title: "PR 1", state: "open" }];
    mockGetPullRequests.mockResolvedValueOnce(mockResponse);

    const caller = createCaller(mockContext);
    const result = await caller.gitfusion.getPullRequestList({
      clusterName: "cluster",
      namespace: "ns",
      gitServer: "github",
      owner: "org",
      repoName: "repo",
      state: "open",
    });

    expect(result).toEqual(mockResponse);
    expect(mockGetPullRequests).toHaveBeenCalledWith("github", "org", "repo", "open", undefined, undefined);
  });

  it("should support pagination parameters", async () => {
    mockGetPullRequests.mockResolvedValueOnce([]);

    const caller = createCaller(mockContext);
    await caller.gitfusion.getPullRequestList({
      clusterName: "cluster",
      namespace: "ns",
      gitServer: "github",
      owner: "org",
      repoName: "repo",
      page: 2,
      perPage: 10,
    });

    expect(mockGetPullRequests).toHaveBeenCalledWith("github", "org", "repo", undefined, 2, 10);
  });
});
