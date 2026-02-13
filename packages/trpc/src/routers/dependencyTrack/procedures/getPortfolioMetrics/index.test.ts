import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetPortfolioMetrics = vi.fn();

vi.mock("../../../../clients/dependencyTrack/index.js", () => ({
  createDependencyTrackClient: () => ({
    getPortfolioMetrics: mockGetPortfolioMetrics,
  }),
}));

describe("dependencyTrack.getPortfolioMetrics", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return portfolio metrics", async () => {
    const mockResponse = [{ projects: 10, critical: 3 }];
    mockGetPortfolioMetrics.mockResolvedValueOnce(mockResponse);

    const caller = createCaller(mockContext);
    const result = await caller.dependencyTrack.getPortfolioMetrics({ days: 90 });

    expect(result).toEqual(mockResponse);
    expect(mockGetPortfolioMetrics).toHaveBeenCalledWith(90);
  });

  it("should throw on client error", async () => {
    mockGetPortfolioMetrics.mockRejectedValueOnce(new Error("Timeout"));

    const caller = createCaller(mockContext);
    await expect(caller.dependencyTrack.getPortfolioMetrics({ days: 90 })).rejects.toThrow("Timeout");
  });
});
