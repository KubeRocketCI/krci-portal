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

describe("tektonResults.getPipelineRunRecords", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return decoded PipelineRun records", async () => {
    const pipelineRun1 = {
      apiVersion: "tekton.dev/v1",
      kind: "PipelineRun",
      metadata: {
        name: "deploy-app-run-1",
        namespace: "test-ns",
        uid: "pr-uid-1",
        labels: { "app.edp.epam.com/pipelinetype": "deploy" },
      },
      spec: { pipelineRef: { name: "deploy-pipeline" } },
      status: {
        conditions: [{ type: "Succeeded", status: "True", reason: "Succeeded" }],
        startTime: "2026-03-08T10:00:00Z",
        completionTime: "2026-03-08T10:15:00Z",
        childReferences: [
          {
            kind: "TaskRun",
            name: "deploy-app-run-1-git-clone",
            apiVersion: "tekton.dev/v1",
            pipelineTaskName: "git-clone",
          },
        ],
      },
    };
    const pipelineRun2 = {
      apiVersion: "tekton.dev/v1",
      kind: "PipelineRun",
      metadata: {
        name: "build-app-run-2",
        namespace: "test-ns",
        uid: "pr-uid-2",
        labels: { "app.edp.epam.com/pipelinetype": "build" },
      },
      spec: { pipelineRef: { name: "build-pipeline" } },
      status: {
        conditions: [{ type: "Succeeded", status: "False", reason: "Failed" }],
        startTime: "2026-03-08T11:00:00Z",
        completionTime: "2026-03-08T11:05:00Z",
      },
    };

    mockListRecords.mockResolvedValueOnce({
      records: [
        {
          name: "ns/results/-/records/rec-1",
          data: { value: Buffer.from(JSON.stringify(pipelineRun1)).toString("base64") },
        },
        {
          name: "ns/results/-/records/rec-2",
          data: { value: Buffer.from(JSON.stringify(pipelineRun2)).toString("base64") },
        },
      ],
      next_page_token: "token-abc",
    });

    const caller = createCaller(mockContext);
    const result = await caller.tektonResults.getPipelineRunRecords({
      namespace: "test-ns",
    });

    expect(result.pipelineRuns).toHaveLength(2);
    expect(result.pipelineRuns[0].metadata.name).toBe("deploy-app-run-1");
    expect(result.pipelineRuns[0].status.childReferences).toHaveLength(1);
    expect(result.pipelineRuns[1].metadata.name).toBe("build-app-run-2");
    expect(result.nextPageToken).toBe("token-abc");
  });

  it("should return empty array when no PipelineRun records exist", async () => {
    mockListRecords.mockResolvedValueOnce({ records: [] });

    const caller = createCaller(mockContext);
    const result = await caller.tektonResults.getPipelineRunRecords({
      namespace: "test-ns",
    });

    expect(result.pipelineRuns).toEqual([]);
    expect(result.nextPageToken).toBeUndefined();
  });

  it("should call listRecords with correct filter and wildcard resultUid", async () => {
    mockListRecords.mockResolvedValueOnce({ records: [] });

    const caller = createCaller(mockContext);
    await caller.tektonResults.getPipelineRunRecords({
      namespace: "test-ns",
    });

    expect(mockListRecords).toHaveBeenCalledWith("-", {
      filter: "data_type == 'tekton.dev/v1.PipelineRun'",
      pageSize: 50,
      pageToken: undefined,
      orderBy: "create_time desc",
    });
  });

  it("should combine caller filter with data_type filter", async () => {
    mockListRecords.mockResolvedValueOnce({ records: [] });

    const caller = createCaller(mockContext);
    await caller.tektonResults.getPipelineRunRecords({
      namespace: "test-ns",
      filter: "data.metadata.labels['app.edp.epam.com/stage'] == 'my-stage'",
    });

    expect(mockListRecords).toHaveBeenCalledWith("-", {
      filter:
        "data.metadata.labels['app.edp.epam.com/stage'] == 'my-stage' && data_type == 'tekton.dev/v1.PipelineRun'",
      pageSize: 50,
      pageToken: undefined,
      orderBy: "create_time desc",
    });
  });

  it("should pass pageSize and pageToken to listRecords", async () => {
    mockListRecords.mockResolvedValueOnce({ records: [], next_page_token: "" });

    const caller = createCaller(mockContext);
    await caller.tektonResults.getPipelineRunRecords({
      namespace: "test-ns",
      pageSize: 20,
      pageToken: "page-2-token",
    });

    expect(mockListRecords).toHaveBeenCalledWith("-", {
      filter: "data_type == 'tekton.dev/v1.PipelineRun'",
      pageSize: 20,
      pageToken: "page-2-token",
      orderBy: "create_time desc",
    });
  });

  it("should throw on decode error", async () => {
    mockListRecords.mockResolvedValueOnce({
      records: [{ name: "ns/results/-/records/rec-1", data: { value: "invalid-base64" } }],
    });

    const caller = createCaller(mockContext);
    await expect(
      caller.tektonResults.getPipelineRunRecords({
        namespace: "test-ns",
      })
    ).rejects.toThrow();
  });

  it("should handle undefined records gracefully", async () => {
    mockListRecords.mockResolvedValueOnce({});

    const caller = createCaller(mockContext);
    const result = await caller.tektonResults.getPipelineRunRecords({
      namespace: "test-ns",
    });

    expect(result.pipelineRuns).toEqual([]);
  });

  it("should return undefined nextPageToken when response has empty token", async () => {
    mockListRecords.mockResolvedValueOnce({
      records: [],
      next_page_token: "",
    });

    const caller = createCaller(mockContext);
    const result = await caller.tektonResults.getPipelineRunRecords({
      namespace: "test-ns",
    });

    expect(result.nextPageToken).toBeUndefined();
  });
});
