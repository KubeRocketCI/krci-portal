import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockInvalidateCache = vi.fn();

vi.mock("../../../../clients/gitfusion/index.js", () => ({
  createGitFusionClient: () => ({
    invalidateCache: mockInvalidateCache,
  }),
}));

describe("gitfusion.invalidateBranchListCache", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should call invalidateCache with branches", async () => {
    mockInvalidateCache.mockResolvedValueOnce({ success: true });

    const caller = createCaller(mockContext);
    const result = await caller.gitfusion.invalidateBranchListCache({
      clusterName: "cluster",
      namespace: "ns",
    });

    expect(mockInvalidateCache).toHaveBeenCalledWith("branches");
    expect(result).toEqual({ success: true });
  });
});
