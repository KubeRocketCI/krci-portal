import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetProject = vi.fn();

vi.mock("../../../../clients/dependencyTrack/index.js", () => ({
  createDependencyTrackClient: () => ({
    getProject: mockGetProject,
  }),
}));

describe("dependencyTrack.getProject", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return project by UUID", async () => {
    const mockResponse = { uuid: "550e8400-e29b-41d4-a716-446655440000", name: "my-project" };
    mockGetProject.mockResolvedValueOnce(mockResponse);

    const caller = createCaller(mockContext);
    const result = await caller.dependencyTrack.getProject({
      uuid: "550e8400-e29b-41d4-a716-446655440000",
    });

    expect(result).toEqual(mockResponse);
    expect(mockGetProject).toHaveBeenCalledWith("550e8400-e29b-41d4-a716-446655440000");
  });

  it("should throw validation error for invalid UUID", async () => {
    const caller = createCaller(mockContext);
    await expect(caller.dependencyTrack.getProject({ uuid: "invalid" })).rejects.toThrowError();
  });
});
