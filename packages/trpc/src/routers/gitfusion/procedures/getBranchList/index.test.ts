import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetBranches = vi.fn();

vi.mock("../../../../clients/gitfusion/index.js", () => ({
  createGitFusionClient: () => ({
    getBranches: mockGetBranches,
  }),
}));

describe("gitfusion.getBranchList", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return branch list", async () => {
    const mockResponse = [{ name: "main" }, { name: "develop" }];
    mockGetBranches.mockResolvedValueOnce(mockResponse);

    const caller = createCaller(mockContext);
    const result = await caller.gitfusion.getBranchList({
      clusterName: "cluster",
      namespace: "ns",
      gitServer: "github",
      owner: "org",
      repoName: "repo",
    });

    expect(result).toEqual(mockResponse);
    expect(mockGetBranches).toHaveBeenCalledWith("github", "org", "repo");
  });
});
