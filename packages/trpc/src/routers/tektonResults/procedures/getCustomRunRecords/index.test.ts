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

const RESULT_UID = "a0a0a0a0-b1b1-c2c2-d3d3-e4e4e4e4e4e4";

describe("tektonResults.getCustomRunRecords", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns decoded CustomRun records", async () => {
    const customRun = {
      apiVersion: "tekton.dev/v1beta1",
      kind: "CustomRun",
      metadata: {
        name: "run-1-approve",
        namespace: "test-ns",
        uid: "cr-uid-1",
        labels: { "tekton.dev/pipelineTask": "approve" },
      },
      spec: { customRef: { apiVersion: "edp.epam.com/v1alpha1", kind: "ApprovalTask", name: "approve" } },
      status: {
        conditions: [{ type: "Succeeded", status: "True", reason: "Approved" }],
        startTime: "2026-09-06T18:00:00Z",
        completionTime: "2026-09-06T18:00:05Z",
      },
    };

    mockListRecords.mockResolvedValueOnce({
      records: [
        {
          name: "ns/results/uid-1/records/rec-1",
          data: { value: Buffer.from(JSON.stringify(customRun)).toString("base64") },
        },
      ],
    });

    const caller = createCaller(mockContext);
    const result = await caller.tektonResults.getCustomRunRecords({ namespace: "test-ns", resultUid: RESULT_UID });

    expect(result.customRuns).toHaveLength(1);
    expect(result.customRuns[0].metadata.name).toBe("run-1-approve");
    expect(result.customRuns[0].status?.conditions?.[0]?.reason).toBe("Approved");
  });

  it("filters on the CustomRun data type", async () => {
    mockListRecords.mockResolvedValueOnce({ records: [] });

    const caller = createCaller(mockContext);
    const result = await caller.tektonResults.getCustomRunRecords({ namespace: "test-ns", resultUid: RESULT_UID });

    expect(result.customRuns).toEqual([]);
    expect(mockListRecords).toHaveBeenCalledWith(RESULT_UID, {
      filter: "data_type == 'tekton.dev/v1beta1.CustomRun'",
      pageSize: 50,
    });
  });

  it("throws on a record that does not decode", async () => {
    mockListRecords.mockResolvedValueOnce({
      records: [{ name: "ns/results/uid-1/records/rec-1", data: { value: "invalid-base64" } }],
    });

    const caller = createCaller(mockContext);
    await expect(
      caller.tektonResults.getCustomRunRecords({ namespace: "test-ns", resultUid: RESULT_UID })
    ).rejects.toThrow();
  });
});
