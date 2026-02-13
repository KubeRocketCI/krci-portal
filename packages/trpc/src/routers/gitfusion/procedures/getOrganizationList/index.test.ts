import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetOrganizations = vi.fn();

vi.mock("../../../../clients/gitfusion/index.js", () => ({
  createGitFusionClient: () => ({
    getOrganizations: mockGetOrganizations,
  }),
}));

describe("gitfusion.getOrganizationList", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return organization list", async () => {
    const mockResponse = [{ login: "org1" }, { login: "org2" }];
    mockGetOrganizations.mockResolvedValueOnce(mockResponse);

    const caller = createCaller(mockContext);
    const result = await caller.gitfusion.getOrganizationList({
      clusterName: "cluster",
      namespace: "ns",
      gitServer: "github",
    });

    expect(result).toEqual(mockResponse);
    expect(mockGetOrganizations).toHaveBeenCalledWith("github");
  });
});
