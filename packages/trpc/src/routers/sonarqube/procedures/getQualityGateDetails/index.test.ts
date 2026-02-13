import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetQualityGateDetails = vi.fn();

vi.mock("../../../../clients/sonarqube/index.js", () => ({
  createSonarQubeClient: () => ({
    getQualityGateDetails: mockGetQualityGateDetails,
  }),
}));

describe("sonarqube.getQualityGateDetails", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return quality gate details", async () => {
    const mockResponse = {
      projectStatus: {
        status: "OK",
        conditions: [{ status: "OK", metricKey: "new_bugs", comparator: "GT", errorThreshold: "0", actualValue: "0" }],
      },
    };

    mockGetQualityGateDetails.mockResolvedValueOnce(mockResponse);

    const caller = createCaller(mockContext);
    const result = await caller.sonarqube.getQualityGateDetails({ projectKey: "my-service" });

    expect(result.projectStatus.status).toBe("OK");
    expect(result.projectStatus.conditions).toHaveLength(1);
  });

  it("should throw on API error", async () => {
    mockGetQualityGateDetails.mockRejectedValueOnce(new Error("Service Unavailable"));

    const caller = createCaller(mockContext);
    await expect(caller.sonarqube.getQualityGateDetails({ projectKey: "error" })).rejects.toThrow(
      "Service Unavailable"
    );
  });
});
