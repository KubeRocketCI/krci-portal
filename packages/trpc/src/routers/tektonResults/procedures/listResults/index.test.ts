import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockListResults = vi.fn();

vi.mock("../../../../clients/tektonResults/index.js", () => ({
  createTektonResultsClient: () => ({
    listResults: mockListResults,
  }),
}));

describe("tektonResults.listResults", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return results list", async () => {
    const mockResponse = {
      results: [{ uid: "result-1", name: "ns/results/uid-1" }],
      nextPageToken: "token",
    };
    mockListResults.mockResolvedValueOnce(mockResponse);

    const caller = createCaller(mockContext);
    const result = await caller.tektonResults.listResults({
      namespace: "test-ns",
      pageSize: 10,
    });

    expect(result).toEqual(mockResponse);
    expect(mockListResults).toHaveBeenCalledWith(expect.objectContaining({ pageSize: 10 }));
  });

  it("should throw on client error", async () => {
    mockListResults.mockRejectedValueOnce(new Error("Not found"));

    const caller = createCaller(mockContext);
    await expect(caller.tektonResults.listResults({ namespace: "test-ns" })).rejects.toThrow("Not found");
  });
});
