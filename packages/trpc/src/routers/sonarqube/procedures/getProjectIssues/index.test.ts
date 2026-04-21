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

  const emptyResp = {
    total: 0,
    p: 1,
    ps: 25,
    paging: { pageIndex: 1, pageSize: 25, total: 0 },
    issues: [],
  };

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

  it("should forward pullRequest and filters", async () => {
    mockGetIssues.mockResolvedValueOnce(emptyResp);

    const caller = createCaller(mockContext);
    await caller.sonarqube.getProjectIssues({
      componentKeys: "my-service",
      pullRequest: "123",
      types: "BUG,VULNERABILITY",
      severities: "BLOCKER,CRITICAL",
      statuses: "OPEN",
      resolved: "true",
      s: "SEVERITY",
      asc: "true",
      p: 2,
      ps: 50,
    });

    expect(mockGetIssues).toHaveBeenCalledWith(
      expect.objectContaining({
        componentKeys: "my-service",
        pullRequest: "123",
        types: "BUG,VULNERABILITY",
        severities: "BLOCKER,CRITICAL",
        statuses: "OPEN",
        resolved: "true",
        s: "SEVERITY",
        asc: "true",
        p: 2,
        ps: 50,
      })
    );
  });

  it("should default resolved=false when not provided (UI regression)", async () => {
    mockGetIssues.mockResolvedValueOnce(emptyResp);

    const caller = createCaller(mockContext);
    await caller.sonarqube.getProjectIssues({ componentKeys: "my-service", p: 1, ps: 25 });

    const forwarded = mockGetIssues.mock.calls[0][0];
    expect(forwarded.resolved).toBe("false");
    expect(forwarded.pullRequest).toBeUndefined();
    expect(forwarded.branch).toBeUndefined();
  });

  it("should forward branch when supplied", async () => {
    mockGetIssues.mockResolvedValueOnce(emptyResp);

    const caller = createCaller(mockContext);
    await caller.sonarqube.getProjectIssues({ componentKeys: "my-service", branch: "main", p: 1, ps: 25 });

    expect(mockGetIssues).toHaveBeenCalledWith(
      expect.objectContaining({ componentKeys: "my-service", branch: "main" })
    );
  });

  it("should reject pullRequest and branch at once", async () => {
    const caller = createCaller(mockContext);
    await expect(
      caller.sonarqube.getProjectIssues({
        componentKeys: "my-service",
        pullRequest: "123",
        branch: "main",
        p: 1,
        ps: 25,
      })
    ).rejects.toThrow(/mutually exclusive/);
  });

  it("should throw NOT_FOUND with branch message on Sonar 404 (branch)", async () => {
    mockGetIssues.mockRejectedValueOnce(new Error("SonarQube API request failed: 404 Not Found"));

    const caller = createCaller(mockContext);
    await expect(
      caller.sonarqube.getProjectIssues({ componentKeys: "my-service", branch: "feat/x", p: 1, ps: 25 })
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "branch feat/x not found",
    });
  });

  it("should reject unknown fields via .strict()", async () => {
    const caller = createCaller(mockContext);
    await expect(
      caller.sonarqube.getProjectIssues({
        componentKeys: "my-service",
        p: 1,
        ps: 25,
        // @ts-expect-error — deliberately passing an unknown field
        foo: "bar",
      })
    ).rejects.toThrow();
  });

  it("should throw NOT_FOUND on Sonar 404", async () => {
    mockGetIssues.mockRejectedValueOnce(new Error("SonarQube API request failed: 404 Not Found"));

    const caller = createCaller(mockContext);
    await expect(caller.sonarqube.getProjectIssues({ componentKeys: "nope", p: 1, ps: 25 })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "project nope not found",
    });
  });

  it("should throw INTERNAL_SERVER_ERROR on Sonar 5xx", async () => {
    mockGetIssues.mockRejectedValueOnce(new Error("SonarQube API request failed: 500 Internal Server Error"));

    const caller = createCaller(mockContext);
    await expect(caller.sonarqube.getProjectIssues({ componentKeys: "err", p: 1, ps: 25 })).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
  });
});
