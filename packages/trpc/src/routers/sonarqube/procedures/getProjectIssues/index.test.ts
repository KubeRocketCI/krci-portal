import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetIssues = vi.fn();

vi.mock("../../../../clients/sonarqube/index.js", () => ({
  createSonarQubeClient: () => ({
    getIssues: mockGetIssues,
  }),
}));

describe("sonarqube.getProjectIssues", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return issues list", async () => {
    const mockResponse = {
      total: 1,
      p: 1,
      ps: 25,
      paging: { pageIndex: 1, pageSize: 25, total: 1 },
      issues: [
        {
          key: "issue1",
          component: "my-service:src/main.ts",
          project: "my-service",
          rule: "typescript:S1234",
          message: "Avoid empty blocks",
          severity: "CRITICAL",
          type: "BUG",
          status: "OPEN",
          creationDate: "2025-01-01T00:00:00Z",
        },
      ],
    };

    mockGetIssues.mockResolvedValueOnce(mockResponse);

    const caller = createCaller(mockContext);
    const result = await caller.sonarqube.getProjectIssues({
      componentKeys: "my-service",
      p: 1,
      ps: 25,
    });

    expect(result.issues).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(mockGetIssues).toHaveBeenCalledWith(expect.objectContaining({ componentKeys: "my-service" }));
  });

  it("should throw on API error", async () => {
    mockGetIssues.mockRejectedValueOnce(new Error("API Error"));

    const caller = createCaller(mockContext);
    await expect(caller.sonarqube.getProjectIssues({ componentKeys: "error", p: 1, ps: 25 })).rejects.toThrow(
      "API Error"
    );
  });
});
