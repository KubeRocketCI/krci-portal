import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetComponent = vi.fn();
const mockGetMeasures = vi.fn();
const mockParseMeasures = vi.fn();

vi.mock("../../../../clients/sonarqube/index.js", () => ({
  createSonarQubeClient: () => ({
    getComponent: mockGetComponent,
    getMeasures: mockGetMeasures,
    parseMeasures: mockParseMeasures,
  }),
}));

describe("sonarqube.getProject", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
    // getMeasures runs in parallel with getComponent, so every test path needs it resolved.
    mockGetMeasures.mockResolvedValue({});
    mockParseMeasures.mockReturnValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return project with metrics and quality gate status", async () => {
    mockGetComponent.mockResolvedValueOnce({
      component: { key: "my-service", name: "My Service", qualifier: "TRK", visibility: "public" },
    });
    mockGetMeasures.mockResolvedValueOnce({});
    mockParseMeasures.mockReturnValueOnce({ alert_status: "OK", bugs: "0" });

    const caller = createCaller(mockContext);
    const result = await caller.sonarqube.getProject({ componentKey: "my-service" });

    expect(result).not.toBeNull();
    expect(result!.key).toBe("my-service");
    expect(result!.qualityGateStatus).toBe("OK");
    expect(result!.measures).toEqual({ alert_status: "OK", bugs: "0" });
    expect(mockGetComponent).toHaveBeenCalledWith("my-service", undefined);
    expect(mockGetMeasures).toHaveBeenCalledWith("my-service", expect.any(Array), undefined);
  });

  it("should throw NOT_FOUND when project not found", async () => {
    mockGetComponent.mockResolvedValueOnce(null);

    const caller = createCaller(mockContext);
    await expect(caller.sonarqube.getProject({ componentKey: "nonexistent" })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "project nonexistent not found",
    });
  });

  it("should throw NOT_FOUND with pull-request message when PR 404", async () => {
    mockGetComponent.mockResolvedValueOnce(null);

    const caller = createCaller(mockContext);
    await expect(caller.sonarqube.getProject({ componentKey: "my-service", pullRequest: "123" })).rejects.toMatchObject(
      {
        code: "NOT_FOUND",
        message: "pull request 123 not found",
      }
    );
  });

  it("should throw INTERNAL_SERVER_ERROR on upstream failure", async () => {
    mockGetComponent.mockRejectedValueOnce(new Error("500 Internal Server Error"));

    const caller = createCaller(mockContext);
    await expect(caller.sonarqube.getProject({ componentKey: "error" })).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
  });

  it("should reject unknown fields via .strict()", async () => {
    const caller = createCaller(mockContext);
    // @ts-expect-error — deliberately passing an unknown field
    await expect(caller.sonarqube.getProject({ componentKey: "ok", foo: "bar" })).rejects.toThrow();
  });

  it("should forward pullRequest when supplied", async () => {
    mockGetComponent.mockResolvedValueOnce({
      component: { key: "my-service", name: "My Service" },
    });
    mockGetMeasures.mockResolvedValueOnce({});
    mockParseMeasures.mockReturnValueOnce({});

    const caller = createCaller(mockContext);
    await caller.sonarqube.getProject({ componentKey: "my-service", pullRequest: "123" });

    expect(mockGetComponent).toHaveBeenCalledWith("my-service", "123");
    expect(mockGetMeasures).toHaveBeenCalledWith("my-service", expect.any(Array), "123");
  });

  it("should omit pullRequest from upstream call when not supplied (UI regression)", async () => {
    mockGetComponent.mockResolvedValueOnce({
      component: { key: "my-service", name: "My Service" },
    });
    mockGetMeasures.mockResolvedValueOnce({});
    mockParseMeasures.mockReturnValueOnce({});

    const caller = createCaller(mockContext);
    await caller.sonarqube.getProject({ componentKey: "my-service" });

    expect(mockGetComponent.mock.calls[0][1]).toBeUndefined();
    expect(mockGetMeasures.mock.calls[0][2]).toBeUndefined();
  });
});
