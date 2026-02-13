import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetProjectMetrics = vi.fn();

vi.mock("../../../../clients/dependencyTrack/index.js", () => ({
  createDependencyTrackClient: () => ({
    getProjectMetrics: mockGetProjectMetrics,
  }),
}));

describe("dependencyTrack.getProjectMetrics", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return project metrics", async () => {
    const mockResponse = [{ critical: 1, high: 5, medium: 10 }];
    mockGetProjectMetrics.mockResolvedValueOnce(mockResponse);

    const caller = createCaller(mockContext);
    const result = await caller.dependencyTrack.getProjectMetrics({
      uuid: "550e8400-e29b-41d4-a716-446655440000",
      days: 30,
    });

    expect(result).toEqual(mockResponse);
    expect(mockGetProjectMetrics).toHaveBeenCalledWith("550e8400-e29b-41d4-a716-446655440000", 30);
  });

  it("should throw validation error for invalid UUID", async () => {
    const caller = createCaller(mockContext);
    await expect(caller.dependencyTrack.getProjectMetrics({ uuid: "invalid", days: 30 })).rejects.toThrowError();
  });
});
