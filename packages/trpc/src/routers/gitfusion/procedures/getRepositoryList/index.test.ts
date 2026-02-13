import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetRepositories = vi.fn();

vi.mock("../../../../clients/gitfusion/index.js", () => ({
  createGitFusionClient: () => ({
    getRepositories: mockGetRepositories,
  }),
}));

describe("gitfusion.getRepositoryList", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return repository list", async () => {
    const mockResponse = [{ name: "repo1" }, { name: "repo2" }];
    mockGetRepositories.mockResolvedValueOnce(mockResponse);

    const caller = createCaller(mockContext);
    const result = await caller.gitfusion.getRepositoryList({
      clusterName: "cluster",
      namespace: "ns",
      gitServer: "github",
      owner: "org",
    });

    expect(result).toEqual(mockResponse);
    expect(mockGetRepositories).toHaveBeenCalledWith("github", "org");
  });

  it("should throw on client error", async () => {
    mockGetRepositories.mockRejectedValueOnce(new Error("Connection error"));

    const caller = createCaller(mockContext);
    await expect(
      caller.gitfusion.getRepositoryList({
        clusterName: "cluster",
        namespace: "ns",
        gitServer: "github",
        owner: "org",
      })
    ).rejects.toThrow("Connection error");
  });
});
