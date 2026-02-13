import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetProjects = vi.fn();

vi.mock("../../../../clients/dependencyTrack/index.js", () => ({
  createDependencyTrackClient: () => ({
    getProjects: mockGetProjects,
  }),
}));

describe("dependencyTrack.getProjects", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return projects list", async () => {
    const mockResponse = [{ uuid: "uuid-1", name: "project-1" }];
    mockGetProjects.mockResolvedValueOnce(mockResponse);

    const caller = createCaller(mockContext);
    const result = await caller.dependencyTrack.getProjects({ pageNumber: 0, pageSize: 25 });

    expect(result).toEqual(mockResponse);
    expect(mockGetProjects).toHaveBeenCalledWith(expect.objectContaining({ pageNumber: 0, pageSize: 25 }));
  });

  it("should throw on client error", async () => {
    mockGetProjects.mockRejectedValueOnce(new Error("Connection refused"));

    const caller = createCaller(mockContext);
    await expect(caller.dependencyTrack.getProjects({})).rejects.toThrow("Connection refused");
  });
});
