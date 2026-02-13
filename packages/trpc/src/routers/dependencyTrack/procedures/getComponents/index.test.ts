import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetComponents = vi.fn();

vi.mock("../../../../clients/dependencyTrack/index.js", () => ({
  createDependencyTrackClient: () => ({
    getComponents: mockGetComponents,
  }),
}));

describe("dependencyTrack.getComponents", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return components for a project", async () => {
    const mockResponse = [{ uuid: "comp-1", name: "lodash" }];
    mockGetComponents.mockResolvedValueOnce(mockResponse);

    const caller = createCaller(mockContext);
    const result = await caller.dependencyTrack.getComponents({
      uuid: "550e8400-e29b-41d4-a716-446655440000",
    });

    expect(result).toEqual(mockResponse);
    expect(mockGetComponents).toHaveBeenCalledWith(
      "550e8400-e29b-41d4-a716-446655440000",
      expect.objectContaining({ pageNumber: 0, pageSize: 25 })
    );
  });
});
