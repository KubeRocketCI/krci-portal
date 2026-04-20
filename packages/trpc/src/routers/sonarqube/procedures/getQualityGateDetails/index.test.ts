import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetQualityGateStatus = vi.fn();

vi.mock("../../../../clients/sonarqube/index.js", () => ({
  createSonarQubeClient: () => ({
    getQualityGateStatus: mockGetQualityGateStatus,
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

    mockGetQualityGateStatus.mockResolvedValueOnce(mockResponse);

    const caller = createCaller(mockContext);
    const result = await caller.sonarqube.getQualityGateDetails({ projectKey: "my-service" });

    expect(result.projectStatus.status).toBe("OK");
    expect(result.projectStatus.conditions).toHaveLength(1);
    expect(mockGetQualityGateStatus).toHaveBeenCalledWith("my-service", undefined);
  });

  it("should return status=NONE verbatim on never-analyzed project", async () => {
    mockGetQualityGateStatus.mockResolvedValueOnce({
      projectStatus: { status: "NONE", conditions: [] },
    });
    const caller = createCaller(mockContext);
    const result = await caller.sonarqube.getQualityGateDetails({ projectKey: "legacy" });
    expect(result.projectStatus.status).toBe("NONE");
  });

  it("should forward pullRequest when supplied", async () => {
    mockGetQualityGateStatus.mockResolvedValueOnce({
      projectStatus: { status: "OK", conditions: [] },
    });

    const caller = createCaller(mockContext);
    await caller.sonarqube.getQualityGateDetails({ projectKey: "my-service", pullRequest: "123" });

    expect(mockGetQualityGateStatus).toHaveBeenCalledWith("my-service", "123");
  });

  it("should omit pullRequest from upstream call when not supplied (UI regression)", async () => {
    mockGetQualityGateStatus.mockResolvedValueOnce({
      projectStatus: { status: "OK", conditions: [] },
    });

    const caller = createCaller(mockContext);
    await caller.sonarqube.getQualityGateDetails({ projectKey: "my-service" });

    expect(mockGetQualityGateStatus.mock.calls[0][1]).toBeUndefined();
  });

  it("should reject unknown fields via .strict()", async () => {
    const caller = createCaller(mockContext);
    // @ts-expect-error — deliberately passing an unknown field
    await expect(caller.sonarqube.getQualityGateDetails({ projectKey: "ok", foo: "bar" })).rejects.toThrow();
  });

  it("should throw NOT_FOUND on Sonar 404 (project)", async () => {
    mockGetQualityGateStatus.mockRejectedValueOnce(new Error("SonarQube API request failed: 404 Not Found"));

    const caller = createCaller(mockContext);
    await expect(caller.sonarqube.getQualityGateDetails({ projectKey: "nope" })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "project nope not found",
    });
  });

  it("should throw NOT_FOUND with pull-request message on Sonar 404 (PR)", async () => {
    mockGetQualityGateStatus.mockRejectedValueOnce(new Error("SonarQube API request failed: 404 Not Found"));

    const caller = createCaller(mockContext);
    await expect(
      caller.sonarqube.getQualityGateDetails({ projectKey: "my-service", pullRequest: "999" })
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "pull request 999 not found",
    });
  });

  it("should throw INTERNAL_SERVER_ERROR on Sonar 5xx", async () => {
    mockGetQualityGateStatus.mockRejectedValueOnce(new Error("SonarQube API request failed: 503 Service Unavailable"));

    const caller = createCaller(mockContext);
    await expect(caller.sonarqube.getQualityGateDetails({ projectKey: "err" })).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
  });
});
