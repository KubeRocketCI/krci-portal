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
      resultUid: "a0a0a0a0-b1b1-c2c2-d3d3-e4e4e4e4e4e4",
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
      resultUid: "a0a0a0a0-b1b1-c2c2-d3d3-e4e4e4e4e4e4",
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
      resultUid: "a0a0a0a0-b1b1-c2c2-d3d3-e4e4e4e4e4e4",
      taskRunName: "run-build-abc",
    });

    expect(result.hasLogs).toBe(false);
    expect(result.error).toBe("Network error");
  });

  describe("stepName filtering", () => {
    const multiStepLogs = [
      "[prepare] 2026/03/08 12:15:48 Entrypoint initialization",
      "[place-scripts] 2026/03/08 12:15:50 Decoded script",
      "[prepare-project] Project already exists",
      "[prepare-project] Configuring project settings",
      "[sonar-scanner] INFO: Scanner starting",
      "[sonar-scanner] INFO: Analysis complete",
    ].join("\n");

    function setupLogMock() {
      const logData = { status: { isStored: true, size: 500 } };
      const encodedData = Buffer.from(JSON.stringify(logData)).toString("base64");

      mockListRecords.mockResolvedValueOnce({
        records: [{ name: "ns/results/uid-1/records/log-1", data: { value: encodedData } }],
      });
      mockGetLogContent.mockResolvedValueOnce(multiStepLogs);
    }

    it("should filter logs by stepName when provided", async () => {
      setupLogMock();

      const caller = createCaller(mockContext);
      const result = await caller.tektonResults.getTaskRunLogs({
        namespace: "test-ns",
        resultUid: "a0a0a0a0-b1b1-c2c2-d3d3-e4e4e4e4e4e4",
        taskRunName: "run-sonar-abc",
        stepName: "sonar-scanner",
      });

      expect(result.hasLogs).toBe(true);
      expect(result.stepFiltered).toBe(true);
      expect(result.logs).toContain("Scanner starting");
      expect(result.logs).toContain("Analysis complete");
      expect(result.logs).not.toContain("Entrypoint");
      expect(result.logs).not.toContain("prepare-project");
    });

    it("should strip step prefix from filtered lines", async () => {
      setupLogMock();

      const caller = createCaller(mockContext);
      const result = await caller.tektonResults.getTaskRunLogs({
        namespace: "test-ns",
        resultUid: "a0a0a0a0-b1b1-c2c2-d3d3-e4e4e4e4e4e4",
        taskRunName: "run-sonar-abc",
        stepName: "prepare-project",
      });

      expect(result.logs).not.toContain("[prepare-project]");
      expect(result.logs).toContain("Project already exists");
    });

    it("should return full log when stepName has no matches (graceful degradation)", async () => {
      setupLogMock();

      const caller = createCaller(mockContext);
      const result = await caller.tektonResults.getTaskRunLogs({
        namespace: "test-ns",
        resultUid: "a0a0a0a0-b1b1-c2c2-d3d3-e4e4e4e4e4e4",
        taskRunName: "run-sonar-abc",
        stepName: "nonexistent-step",
      });

      expect(result.hasLogs).toBe(true);
      expect(result.stepFiltered).toBe(false);
      // Should return full log since no lines matched
      expect(result.logs).toContain("[prepare]");
      expect(result.logs).toContain("[sonar-scanner]");
    });

    it("should not filter when stepName is not provided", async () => {
      setupLogMock();

      const caller = createCaller(mockContext);
      const result = await caller.tektonResults.getTaskRunLogs({
        namespace: "test-ns",
        resultUid: "a0a0a0a0-b1b1-c2c2-d3d3-e4e4e4e4e4e4",
        taskRunName: "run-sonar-abc",
      });

      expect(result.hasLogs).toBe(true);
      expect(result.stepFiltered).toBeUndefined();
      expect(result.logs).toContain("[prepare]");
      expect(result.logs).toContain("[sonar-scanner]");
      expect(result.logs).toContain("[prepare-project]");
    });

    it("should not confuse step name that is prefix of another", async () => {
      setupLogMock();

      const caller = createCaller(mockContext);
      const result = await caller.tektonResults.getTaskRunLogs({
        namespace: "test-ns",
        resultUid: "a0a0a0a0-b1b1-c2c2-d3d3-e4e4e4e4e4e4",
        taskRunName: "run-sonar-abc",
        stepName: "prepare",
      });

      // Should only match [prepare] lines, not [prepare-project]
      expect(result.logs).toContain("Entrypoint initialization");
      expect(result.logs).not.toContain("Project already exists");
    });
  });
});
