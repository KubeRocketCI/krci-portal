import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetProjectByNameAndVersion = vi.fn();

vi.mock("../../../../clients/dependencyTrack/index.js", () => ({
  createDependencyTrackClient: () => ({
    getProjectByNameAndVersion: mockGetProjectByNameAndVersion,
  }),
}));

describe("dependencyTrack.getProjectByNameAndVersion", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return project when found", async () => {
    const mockProject = { uuid: "uuid-1", name: "my-service", version: "main" };
    mockGetProjectByNameAndVersion.mockResolvedValueOnce(mockProject);

    const caller = createCaller(mockContext);
    const result = await caller.dependencyTrack.getProjectByNameAndVersion({
      projectName: "my-service",
      defaultBranch: "main",
    });

    expect(result).toEqual(mockProject);
    expect(mockGetProjectByNameAndVersion).toHaveBeenCalledWith("my-service", "main");
  });

  it("should return null when project not found", async () => {
    mockGetProjectByNameAndVersion.mockResolvedValueOnce(null);

    const caller = createCaller(mockContext);
    const result = await caller.dependencyTrack.getProjectByNameAndVersion({
      projectName: "missing",
      defaultBranch: "main",
    });

    expect(result).toBeNull();
  });

  it("should throw on client error", async () => {
    mockGetProjectByNameAndVersion.mockRejectedValueOnce(new Error("Network error"));

    const caller = createCaller(mockContext);
    await expect(
      caller.dependencyTrack.getProjectByNameAndVersion({
        projectName: "error",
        defaultBranch: "main",
      })
    ).rejects.toThrow();
  });
});
