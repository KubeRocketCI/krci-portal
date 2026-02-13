import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetRecord = vi.fn();
const mockListRecords = vi.fn();
const mockGetLogContent = vi.fn();

vi.mock("../../../../clients/tektonResults/index.js", () => ({
  createTektonResultsClient: () => ({
    getRecord: mockGetRecord,
    listRecords: mockListRecords,
    getLogContent: mockGetLogContent,
  }),
}));

describe("tektonResults.getPipelineRunLogs", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return formatted logs for PipelineRun with TaskRun logs", async () => {
    const childRefs = [{ pipelineTaskName: "task-1", name: "taskrun-1" }];
    const pipelineRunData = Buffer.from(JSON.stringify({ status: { childReferences: childRefs } })).toString("base64");
    mockGetRecord.mockResolvedValueOnce({
      data: { value: pipelineRunData },
    });
    const logRecordData = Buffer.from(JSON.stringify({ status: { isStored: true, size: 10 } })).toString("base64");
    mockListRecords.mockResolvedValueOnce({
      records: [
        {
          name: "default/results/result-uid/records/log-record-uid",
          data: { value: logRecordData },
        },
      ],
    });
    mockGetLogContent.mockResolvedValueOnce("line 1\nline 2\n");

    const caller = createCaller(mockContext);
    const result = await caller.tektonResults.getPipelineRunLogs({
      namespace: "default",
      resultUid: "result-uid",
      recordUid: "record-uid",
    });

    expect(result.logs).toContain("task-1");
    expect(result.logs).toContain("taskrun-1");
    expect(result.logs).toContain("line 1");
    expect(mockGetRecord).toHaveBeenCalledWith("result-uid", "record-uid");
  });

  it("should return message when no logs available", async () => {
    const emptyPipelineRunData = Buffer.from(JSON.stringify({ status: { childReferences: [] } })).toString("base64");
    mockGetRecord.mockResolvedValueOnce({
      data: { value: emptyPipelineRunData },
    });

    const caller = createCaller(mockContext);
    const result = await caller.tektonResults.getPipelineRunLogs({
      namespace: "default",
      resultUid: "result-uid",
      recordUid: "record-uid",
    });

    expect(result.logs).toBe("No logs available for this PipelineRun");
  });

  it("should throw on client error", async () => {
    mockGetRecord.mockRejectedValueOnce(new Error("Connection refused"));

    const caller = createCaller(mockContext);
    await expect(
      caller.tektonResults.getPipelineRunLogs({
        namespace: "default",
        resultUid: "result-uid",
        recordUid: "record-uid",
      })
    ).rejects.toThrow("Connection refused");
  });
});
