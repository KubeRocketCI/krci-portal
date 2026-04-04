import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockListResults = vi.fn();

vi.mock("../../../../clients/tektonResults/index.js", () => ({
  createTektonResultsClient: () => ({
    listResults: mockListResults,
  }),
}));

describe("tektonResults.getPipelineRunResults", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return results with type filter when no user filter is provided", async () => {
    mockListResults.mockResolvedValueOnce({
      results: [
        {
          name: "test-ns/results/uid-1",
          uid: "uid-1",
          annotations: { repo: "my-repo" },
          summary: { type: "tekton.dev/v1.PipelineRun", status: "SUCCESS" },
        },
        {
          name: "test-ns/results/uid-2",
          uid: "uid-2",
          annotations: {},
          summary: { type: "tekton.dev/v1.PipelineRun", status: "FAILURE" },
        },
      ],
      next_page_token: "token-abc",
    });

    const caller = createCaller(mockContext);
    const result = await caller.tektonResults.getPipelineRunResults({
      namespace: "test-ns",
    });

    expect(result.results).toHaveLength(2);
    expect(result.results[0].name).toBe("test-ns/results/uid-1");
    expect(result.results[1].uid).toBe("uid-2");
    expect(result.nextPageToken).toBe("token-abc");

    expect(mockListResults).toHaveBeenCalledWith({
      filter: "summary.type == 'tekton.dev/v1.PipelineRun'",
      pageSize: 50,
      pageToken: undefined,
      orderBy: "create_time desc",
    });
  });

  it("should wrap user filter in parentheses and place type guard first", async () => {
    mockListResults.mockResolvedValueOnce({ results: [] });

    const caller = createCaller(mockContext);
    await caller.tektonResults.getPipelineRunResults({
      namespace: "test-ns",
      filter: "summary.status == 1 || summary.status == 2",
    });

    expect(mockListResults).toHaveBeenCalledWith({
      filter: "summary.type == 'tekton.dev/v1.PipelineRun' && (summary.status == 1 || summary.status == 2)",
      pageSize: 50,
      pageToken: undefined,
      orderBy: "create_time desc",
    });
  });

  it("should reject filter with disallowed characters", async () => {
    const caller = createCaller(mockContext);

    await expect(
      caller.tektonResults.getPipelineRunResults({
        namespace: "test-ns",
        filter: "summary.status == 1; DROP TABLE records",
      })
    ).rejects.toThrow();

    await expect(
      caller.tektonResults.getPipelineRunResults({
        namespace: "test-ns",
        filter: "summary.status == `1`",
      })
    ).rejects.toThrow();

    await expect(
      caller.tektonResults.getPipelineRunResults({
        namespace: "test-ns",
        filter: "annotations['foo@bar'] == 'baz'",
      })
    ).rejects.toThrow();

    expect(mockListResults).not.toHaveBeenCalled();
  });

  it("should pass pageSize and pageToken to listResults", async () => {
    mockListResults.mockResolvedValueOnce({ results: [], next_page_token: "" });

    const caller = createCaller(mockContext);
    await caller.tektonResults.getPipelineRunResults({
      namespace: "test-ns",
      pageSize: 20,
      pageToken: "page-2-token",
    });

    expect(mockListResults).toHaveBeenCalledWith({
      filter: "summary.type == 'tekton.dev/v1.PipelineRun'",
      pageSize: 20,
      pageToken: "page-2-token",
      orderBy: "create_time desc",
    });
  });

  it("should return empty array when no results exist", async () => {
    mockListResults.mockResolvedValueOnce({ results: [] });

    const caller = createCaller(mockContext);
    const result = await caller.tektonResults.getPipelineRunResults({
      namespace: "test-ns",
    });

    expect(result.results).toEqual([]);
    expect(result.nextPageToken).toBeUndefined();
  });

  it("should handle undefined response gracefully", async () => {
    mockListResults.mockResolvedValueOnce({});

    const caller = createCaller(mockContext);
    const result = await caller.tektonResults.getPipelineRunResults({
      namespace: "test-ns",
    });

    expect(result.results).toEqual([]);
    expect(result.nextPageToken).toBeUndefined();
  });

  it("should return undefined nextPageToken when response has empty token", async () => {
    mockListResults.mockResolvedValueOnce({
      results: [],
      next_page_token: "",
    });

    const caller = createCaller(mockContext);
    const result = await caller.tektonResults.getPipelineRunResults({
      namespace: "test-ns",
    });

    expect(result.nextPageToken).toBeUndefined();
  });
});
