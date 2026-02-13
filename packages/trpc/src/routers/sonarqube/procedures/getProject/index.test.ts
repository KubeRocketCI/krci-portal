import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetProjects = vi.fn();
const mockGetMeasures = vi.fn();
const mockParseMeasures = vi.fn();

vi.mock("../../../../clients/sonarqube/index.js", () => ({
  createSonarQubeClient: () => ({
    getProjects: mockGetProjects,
    getMeasures: mockGetMeasures,
    parseMeasures: mockParseMeasures,
  }),
}));

describe("sonarqube.getProject", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return project with metrics and quality gate status", async () => {
    mockGetProjects.mockResolvedValueOnce({
      components: [{ key: "my-service", name: "My Service", qualifier: "TRK", visibility: "public" }],
      paging: { pageIndex: 1, pageSize: 1, total: 1 },
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
    mockGetProjects.mockResolvedValueOnce({
      components: [],
      paging: { pageIndex: 1, pageSize: 1, total: 0 },
    });

    const caller = createCaller(mockContext);
    const result = await caller.sonarqube.getProject({ componentKey: "nonexistent" });

    expect(result).toBeNull();
  });

  it("should return null on 404 error", async () => {
    mockGetProjects.mockRejectedValueOnce(new Error("404 Not Found"));

    const caller = createCaller(mockContext);
    const result = await caller.sonarqube.getProject({ componentKey: "missing" });

    expect(result).toBeNull();
  });

  it("should throw on non-404 errors", async () => {
    mockGetProjects.mockRejectedValueOnce(new Error("500 Internal Server Error"));

    const caller = createCaller(mockContext);
    await expect(caller.sonarqube.getProject({ componentKey: "error" })).rejects.toThrow("500");
  });
});
