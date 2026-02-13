import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetRecord = vi.fn();

vi.mock("../../../../clients/tektonResults/index.js", () => ({
  createTektonResultsClient: () => ({
    getRecord: mockGetRecord,
  }),
}));

vi.mock("@my-project/shared", async (importOriginal) => {
  const original = await importOriginal<Record<string, unknown>>();
  return {
    ...original,
    decodeTektonRecordData: vi.fn((value: string) => {
      return JSON.parse(Buffer.from(value, "base64").toString());
    }),
  };
});

describe("tektonResults.getPipelineRun", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return decoded pipeline run", async () => {
    const pipelineRunData = { metadata: { name: "run-1" }, status: { conditions: [] } };
    const encodedData = Buffer.from(JSON.stringify(pipelineRunData)).toString("base64");

    mockGetRecord.mockResolvedValueOnce({
      name: "ns/results/uid-1/records/uid-2",
      data: { value: encodedData },
    });

    const caller = createCaller(mockContext);
    const result = await caller.tektonResults.getPipelineRun({
      namespace: "test-ns",
      resultUid: "uid-1",
      recordUid: "uid-2",
    });

    expect(result.pipelineRun).toEqual(pipelineRunData);
    expect(result.record).toBeDefined();
  });

  it("should throw on client error", async () => {
    mockGetRecord.mockRejectedValueOnce(new Error("Record not found"));

    const caller = createCaller(mockContext);
    await expect(
      caller.tektonResults.getPipelineRun({
        namespace: "test-ns",
        resultUid: "uid-1",
        recordUid: "uid-2",
      })
    ).rejects.toThrow("Record not found");
  });
});
