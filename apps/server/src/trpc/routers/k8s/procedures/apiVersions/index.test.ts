import { createCaller } from "@/trpc/routers";
import { ApisApi } from "@kubernetes/client-node";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultK8sApiVersion } from ".";
import { createMockedContext } from "@/__mocks__/context";

describe("k8sGetApiVersions", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  let mockClientApisApi: { getAPIVersions: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockContext = createMockedContext();

    // Create mock ApisApi instance
    mockClientApisApi = {
      getAPIVersions: vi.fn(),
    };

    // Configure makeApiClient to return the mock ApisApi
    mockContext.K8sClient.KubeConfig.makeApiClient.mockReturnValue(
      mockClientApisApi
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should call getAPIVersions and return version", async () => {
    const caller = createCaller(mockContext);

    const validMockResponse = {
      body: {
        apiVersion: "v1",
        kind: "APIGroupList",
        groups: [
          {
            name: "authorization.k8s.io",
            versions: [{ version: defaultK8sApiVersion }],
            preferredVersion: { version: defaultK8sApiVersion },
          },
        ],
      },
    };

    mockClientApisApi.getAPIVersions.mockResolvedValueOnce(validMockResponse);

    const result = await caller.k8s.apiVersions();

    expect(mockContext.K8sClient.KubeConfig.makeApiClient).toHaveBeenCalledWith(
      ApisApi
    );
    expect(mockClientApisApi.getAPIVersions).toHaveBeenCalled();
    expect(result).toEqual(defaultK8sApiVersion);
  });

  it("should return defaultK8sApiVersion if authorization.k8s.io group is not found", async () => {
    const caller = createCaller(mockContext);

    const invalidMockResponse = {
      body: {
        apiVersion: "v1",
        kind: "APIGroupList",
        groups: [
          {
            name: "another-group.k8s.io",
            versions: [{ version: "v3" }],
            preferredVersion: { version: "v3" },
          },
        ],
      },
    };

    mockClientApisApi.getAPIVersions.mockResolvedValueOnce(invalidMockResponse);

    const result = await caller.k8s.apiVersions();

    expect(mockContext.K8sClient.KubeConfig.makeApiClient).toHaveBeenCalled();
    expect(mockClientApisApi.getAPIVersions).toHaveBeenCalled();
    expect(result).toEqual(defaultK8sApiVersion);
  });

  it("should throw error when Kubernetes API returns 403 Forbidden", async () => {
    const caller = createCaller(mockContext);

    const errorResponse = {
      statusCode: 403,
      message: "Forbidden: User lacks permission",
    };

    mockClientApisApi.getAPIVersions.mockRejectedValueOnce(errorResponse);

    await expect(caller.k8s.apiVersions()).rejects.toThrow(
      "Forbidden: User lacks permission"
    );

    expect(mockClientApisApi.getAPIVersions).toHaveBeenCalled();
  });

  it("should handle Kubernetes API network errors", async () => {
    const caller = createCaller(mockContext);

    const errorResponse = new Error(
      "Network error: Failed to connect to Kubernetes API"
    );

    mockClientApisApi.getAPIVersions.mockRejectedValueOnce(errorResponse);

    await expect(caller.k8s.apiVersions()).rejects.toThrow(
      "Network error: Failed to connect to Kubernetes API"
    );

    expect(mockClientApisApi.getAPIVersions).toHaveBeenCalled();
  });
});
