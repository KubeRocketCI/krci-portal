import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetFindingsByProject = vi.fn();

vi.mock("../../../../clients/dependencyTrack/index.js", () => ({
  createDependencyTrackClient: () => ({
    getFindingsByProject: mockGetFindingsByProject,
  }),
}));

describe("dependencyTrack.getFindingsByProject", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return findings for a project", async () => {
    const mockResponse = [{ vulnerability: { vulnId: "CVE-2023-001" } }];
    mockGetFindingsByProject.mockResolvedValueOnce(mockResponse);

    const caller = createCaller(mockContext);
    const result = await caller.dependencyTrack.getFindingsByProject({
      uuid: "550e8400-e29b-41d4-a716-446655440000",
    });

    expect(result).toEqual(mockResponse);
    expect(mockGetFindingsByProject).toHaveBeenCalledWith("550e8400-e29b-41d4-a716-446655440000", expect.any(Object));
  });
});
