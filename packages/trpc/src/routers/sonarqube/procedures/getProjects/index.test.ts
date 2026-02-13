import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi, Mock } from "vitest";

const mockGetProjects = vi.fn();
const mockGetBatchMeasures = vi.fn();
const mockParseBatchMeasures = vi.fn();

vi.mock("../../../../clients/sonarqube/index.js", () => ({
  createSonarQubeClient: () => ({
    getProjects: mockGetProjects,
    getBatchMeasures: mockGetBatchMeasures,
    parseBatchMeasures: mockParseBatchMeasures,
  }),
}));

describe("sonarqube.getProjects", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return projects with metrics", async () => {
    const mockProjectsResponse = {
      components: [
        { key: "proj1", name: "Project 1" },
        { key: "proj2", name: "Project 2" },
      ],
      paging: { pageIndex: 1, pageSize: 100, total: 2 },
    };

    mockGetProjects.mockResolvedValueOnce(mockProjectsResponse);
    mockGetBatchMeasures.mockResolvedValueOnce({});
    mockParseBatchMeasures.mockReturnValueOnce({
      proj1: { alert_status: "OK", bugs: "0" },
      proj2: { alert_status: "ERROR", bugs: "5" },
    });

    const caller = createCaller(mockContext);
    const result = await caller.sonarqube.getProjects({ page: 1, pageSize: 100 });

    expect(result.projects).toHaveLength(2);
    expect(result.projects[0].qualityGateStatus).toBe("OK");
    expect(result.projects[1].qualityGateStatus).toBe("ERROR");
    expect(result.paging).toEqual(mockProjectsResponse.paging);
  });

  it("should return empty projects when no components found", async () => {
    mockGetProjects.mockResolvedValueOnce({
      components: [],
      paging: { pageIndex: 1, pageSize: 100, total: 0 },
    });

    const caller = createCaller(mockContext);
    const result = await caller.sonarqube.getProjects({ page: 1, pageSize: 100 });

    expect(result.projects).toHaveLength(0);
    expect(mockGetBatchMeasures).not.toHaveBeenCalled();
  });

  it("should continue with empty measures on batch fetch failure", async () => {
    mockGetProjects.mockResolvedValueOnce({
      components: [{ key: "proj1", name: "Project 1" }],
      paging: { pageIndex: 1, pageSize: 100, total: 1 },
    });
    mockGetBatchMeasures.mockRejectedValueOnce(new Error("API Error"));

    const caller = createCaller(mockContext);
    const result = await caller.sonarqube.getProjects({ page: 1, pageSize: 100 });

    expect(result.projects).toHaveLength(1);
    expect(result.projects[0].measures).toBeUndefined();
  });
});
