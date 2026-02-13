import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetSummary = vi.fn();

vi.mock("../../../../clients/tektonResults/index.js", () => ({
  createTektonResultsClient: () => ({
    getSummary: mockGetSummary,
  }),
}));

describe("tektonResults.getSummary", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return summary data", async () => {
    const mockResponse = { summary: [{ total: 100, succeeded: 80, failed: 20 }] };
    mockGetSummary.mockResolvedValueOnce(mockResponse);

    const caller = createCaller(mockContext);
    const result = await caller.tektonResults.getSummary({
      namespace: "test-ns",
      summary: "total,succeeded,failed",
      groupBy: "day",
    });

    expect(result).toEqual(mockResponse);
    expect(mockGetSummary).toHaveBeenCalledWith(
      expect.objectContaining({
        summary: "total,succeeded,failed",
        groupBy: "day",
      })
    );
  });

  it("should reject invalid summary metrics", async () => {
    const caller = createCaller(mockContext);
    await expect(
      caller.tektonResults.getSummary({
        namespace: "test-ns",
        summary: "invalid_metric",
      })
    ).rejects.toThrowError();
  });

  it("should reject invalid groupBy values", async () => {
    const caller = createCaller(mockContext);
    await expect(
      caller.tektonResults.getSummary({
        namespace: "test-ns",
        groupBy: "invalid",
      })
    ).rejects.toThrowError();
  });

  it("should accept groupBy with time field", async () => {
    mockGetSummary.mockResolvedValueOnce({ summary: [] });

    const caller = createCaller(mockContext);
    await caller.tektonResults.getSummary({
      namespace: "test-ns",
      groupBy: "hour startTime",
    });

    expect(mockGetSummary).toHaveBeenCalled();
  });
});
