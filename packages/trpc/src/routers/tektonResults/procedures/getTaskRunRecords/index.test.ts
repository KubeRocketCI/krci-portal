import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockListRecords = vi.fn();

vi.mock("../../../../clients/tektonResults/index.js", () => ({
  createTektonResultsClient: () => ({
    listRecords: mockListRecords,
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

describe("tektonResults.getTaskRunRecords", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return decoded TaskRun records", async () => {
    const taskRun1 = {
      apiVersion: "tekton.dev/v1",
      kind: "TaskRun",
      metadata: {
        name: "run-1-git-clone",
        namespace: "test-ns",
        uid: "tr-uid-1",
        labels: { "tekton.dev/pipelineTask": "git-clone" },
      },
      spec: { taskRef: { name: "git-clone" } },
      status: {
        podName: "run-1-git-clone-pod",
        conditions: [{ type: "Succeeded", status: "True", reason: "Succeeded" }],
        steps: [{ name: "clone", container: "step-clone", terminated: { exitCode: 0 } }],
        startTime: "2026-03-08T12:10:00Z",
        completionTime: "2026-03-08T12:11:00Z",
      },
    };
    const taskRun2 = {
      apiVersion: "tekton.dev/v1",
      kind: "TaskRun",
      metadata: {
        name: "run-1-sonar",
        namespace: "test-ns",
        uid: "tr-uid-2",
        labels: { "tekton.dev/pipelineTask": "sonar" },
      },
      spec: { taskRef: { name: "sonarqube-scanner" } },
      status: {
        podName: "run-1-sonar-pod",
        conditions: [{ type: "Succeeded", status: "True", reason: "Succeeded" }],
        steps: [
          { name: "prepare-project", terminated: { exitCode: 0 } },
          { name: "sonar-scanner", terminated: { exitCode: 0 } },
        ],
        startTime: "2026-03-08T12:11:00Z",
        completionTime: "2026-03-08T12:15:00Z",
      },
    };

    mockListRecords.mockResolvedValueOnce({
      records: [
        {
          name: "ns/results/uid-1/records/rec-1",
          data: { value: Buffer.from(JSON.stringify(taskRun1)).toString("base64") },
        },
        {
          name: "ns/results/uid-1/records/rec-2",
          data: { value: Buffer.from(JSON.stringify(taskRun2)).toString("base64") },
        },
      ],
    });

    const caller = createCaller(mockContext);
    const result = await caller.tektonResults.getTaskRunRecords({
      namespace: "test-ns",
      resultUid: "a0a0a0a0-b1b1-c2c2-d3d3-e4e4e4e4e4e4",
    });

    expect(result.taskRuns).toHaveLength(2);
    expect(result.taskRuns[0].metadata.name).toBe("run-1-git-clone");
    expect(result.taskRuns[0].status.podName).toBe("run-1-git-clone-pod");
    expect(result.taskRuns[1].metadata.name).toBe("run-1-sonar");
    expect(result.taskRuns[1].status.steps).toHaveLength(2);
  });

  it("should return empty array when no TaskRun records exist", async () => {
    mockListRecords.mockResolvedValueOnce({ records: [] });

    const caller = createCaller(mockContext);
    const result = await caller.tektonResults.getTaskRunRecords({
      namespace: "test-ns",
      resultUid: "a0a0a0a0-b1b1-c2c2-d3d3-e4e4e4e4e4e4",
    });

    expect(result.taskRuns).toEqual([]);
  });

  it("should call listRecords with correct filter", async () => {
    mockListRecords.mockResolvedValueOnce({ records: [] });

    const caller = createCaller(mockContext);
    await caller.tektonResults.getTaskRunRecords({
      namespace: "test-ns",
      resultUid: "a0a0a0a0-b1b1-c2c2-d3d3-e4e4e4e4e4e4",
    });

    expect(mockListRecords).toHaveBeenCalledWith("a0a0a0a0-b1b1-c2c2-d3d3-e4e4e4e4e4e4", {
      filter: "data_type == 'tekton.dev/v1.TaskRun'",
      pageSize: 50,
    });
  });

  it("should throw on decode error", async () => {
    mockListRecords.mockResolvedValueOnce({
      records: [{ name: "ns/results/uid-1/records/rec-1", data: { value: "invalid-base64" } }],
    });

    const caller = createCaller(mockContext);
    await expect(
      caller.tektonResults.getTaskRunRecords({
        namespace: "test-ns",
        resultUid: "a0a0a0a0-b1b1-c2c2-d3d3-e4e4e4e4e4e4",
      })
    ).rejects.toThrow();
  });

  it("should handle undefined records gracefully", async () => {
    mockListRecords.mockResolvedValueOnce({});

    const caller = createCaller(mockContext);
    const result = await caller.tektonResults.getTaskRunRecords({
      namespace: "test-ns",
      resultUid: "a0a0a0a0-b1b1-c2c2-d3d3-e4e4e4e4e4e4",
    });

    expect(result.taskRuns).toEqual([]);
  });
});
