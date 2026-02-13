import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetDependencyGraph = vi.fn();

vi.mock("../../../../clients/dependencyTrack/index.js", () => ({
  createDependencyTrackClient: () => ({
    getDependencyGraph: mockGetDependencyGraph,
  }),
}));

describe("dependencyTrack.getDependencyGraph", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return dependency graph", async () => {
    const mockResponse = { nodes: [], edges: [] };
    mockGetDependencyGraph.mockResolvedValueOnce(mockResponse);

    const caller = createCaller(mockContext);
    const result = await caller.dependencyTrack.getDependencyGraph({
      uuid: "550e8400-e29b-41d4-a716-446655440000",
    });

    expect(result).toEqual(mockResponse);
    expect(mockGetDependencyGraph).toHaveBeenCalledWith("550e8400-e29b-41d4-a716-446655440000");
  });
});
