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

describe("tektonResults.getTaskList", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return task list from pipeline run child references", async () => {
    const pipelineRunData = {
      status: {
        childReferences: [
          { pipelineTaskName: "fetch-repo", name: "run-fetch-repo-abc" },
          { pipelineTaskName: "build", name: "run-build-def" },
        ],
      },
    };
    const encodedData = Buffer.from(JSON.stringify(pipelineRunData)).toString("base64");

    mockGetRecord.mockResolvedValueOnce({
      data: { value: encodedData },
    });

    const caller = createCaller(mockContext);
    const result = await caller.tektonResults.getTaskList({
      namespace: "test-ns",
      resultUid: "uid-1",
      recordUid: "uid-2",
    });

    expect(result.tasks).toHaveLength(2);
    expect(result.tasks[0]).toEqual({
      taskName: "fetch-repo",
      taskRunName: "run-fetch-repo-abc",
      order: 0,
    });
  });

  it("should return empty tasks when no child references", async () => {
    const pipelineRunData = { status: {} };
    const encodedData = Buffer.from(JSON.stringify(pipelineRunData)).toString("base64");

    mockGetRecord.mockResolvedValueOnce({
      data: { value: encodedData },
    });

    const caller = createCaller(mockContext);
    const result = await caller.tektonResults.getTaskList({
      namespace: "test-ns",
      resultUid: "uid-1",
      recordUid: "uid-2",
    });

    expect(result.tasks).toHaveLength(0);
  });
});
