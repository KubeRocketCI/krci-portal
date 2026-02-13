import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetViolationsByProject = vi.fn();

vi.mock("../../../../clients/dependencyTrack/index.js", () => ({
  createDependencyTrackClient: () => ({
    getViolationsByProject: mockGetViolationsByProject,
  }),
}));

describe("dependencyTrack.getViolationsByProject", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return violations for a project", async () => {
    const mockResponse = [{ type: "LICENSE", text: "violation" }];
    mockGetViolationsByProject.mockResolvedValueOnce(mockResponse);

    const caller = createCaller(mockContext);
    const result = await caller.dependencyTrack.getViolationsByProject({
      uuid: "550e8400-e29b-41d4-a716-446655440000",
    });

    expect(result).toEqual(mockResponse);
    expect(mockGetViolationsByProject).toHaveBeenCalledWith(
      "550e8400-e29b-41d4-a716-446655440000",
      expect.objectContaining({ pageNumber: 0, pageSize: 25 })
    );
  });
});
