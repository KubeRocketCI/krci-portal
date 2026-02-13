import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockListRecords = vi.fn();
const mockGetLogContent = vi.fn();

vi.mock("../../../../clients/tektonResults/index.js", () => ({
  createTektonResultsClient: () => ({
    listRecords: mockListRecords,
    getLogContent: mockGetLogContent,
  }),
}));

vi.mock("@my-project/shared", async (importOriginal) => {
  const original = await importOriginal<Record<string, unknown>>();
  return {
    ...original,
    decodeTektonRecordData: vi.fn((value: string) => {
      return JSON.parse(Buffer.from(value, "base64").toString());
    }),
    parseRecordName: vi.fn((name: string) => {
      const parts = name.split("/");
      return { resultUid: parts[2], recordUid: parts[4] };
    }),
  };
});

describe("tektonResults.getTaskRunLogs", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return logs when records exist", async () => {
    const logData = { status: { isStored: true, size: 100 } };
    const encodedData = Buffer.from(JSON.stringify(logData)).toString("base64");

    mockListRecords.mockResolvedValueOnce({
      records: [
        {
          name: "ns/results/uid-1/records/log-1",
          data: { value: encodedData },
        },
      ],
    });
    mockGetLogContent.mockResolvedValueOnce("Step 1: Building...\nStep 2: Done.");

    const caller = createCaller(mockContext);
    const result = await caller.tektonResults.getTaskRunLogs({
      namespace: "test-ns",
      resultUid: "uid-1",
      taskRunName: "run-build-abc",
    });

    expect(result.hasLogs).toBe(true);
    expect(result.logs).toContain("Building");
  });

  it("should return empty when no records", async () => {
    mockListRecords.mockResolvedValueOnce({ records: [] });

    const caller = createCaller(mockContext);
    const result = await caller.tektonResults.getTaskRunLogs({
      namespace: "test-ns",
      resultUid: "uid-1",
      taskRunName: "run-build-abc",
    });

    expect(result.hasLogs).toBe(false);
    expect(result.logs).toBe("");
  });

  it("should handle errors gracefully", async () => {
    mockListRecords.mockRejectedValueOnce(new Error("Network error"));

    const caller = createCaller(mockContext);
    const result = await caller.tektonResults.getTaskRunLogs({
      namespace: "test-ns",
      resultUid: "uid-1",
      taskRunName: "run-build-abc",
    });

    expect(result.hasLogs).toBe(false);
    expect(result.error).toBe("Network error");
  });
});
