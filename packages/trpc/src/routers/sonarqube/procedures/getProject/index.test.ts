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
  });

  it("should return null when project not found", async () => {
    mockGetComponent.mockResolvedValueOnce(null);

    const caller = createCaller(mockContext);
    const result = await caller.sonarqube.getProject({ componentKey: "nonexistent" });

    expect(result).toBeNull();
  });

  it("should throw on client errors", async () => {
    mockGetComponent.mockRejectedValueOnce(new Error("500 Internal Server Error"));

    const caller = createCaller(mockContext);
    await expect(caller.sonarqube.getProject({ componentKey: "error" })).rejects.toThrow("500");
  });
});
