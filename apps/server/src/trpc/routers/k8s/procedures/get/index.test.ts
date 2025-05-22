import { createMockedContext } from "@/__mocks__/context";
import { createCaller } from "@/trpc/routers";
import { inferProcedureInput } from "@trpc/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { k8sGetProcedure } from ".";

describe("k8sGetProcedure", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  let mockClientCustomObjectsApi: {
    getNamespacedCustomObject: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockContext = createMockedContext();

    // Create mock ApisApi instance
    mockClientCustomObjectsApi = {
      getNamespacedCustomObject: vi.fn(),
    };

    // Configure makeApiClient to return the mock ApisApi
    mockContext.K8sClient.KubeConfig.makeApiClient.mockReturnValue(
      mockClientCustomObjectsApi
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should call getNamespacedCustomObject with correct parameters", async () => {
    const input = {
      clusterName: "test-cluster",
      group: "test.group.io",
      version: "v1",
      namespace: "test-namespace",
      resourcePlural: "testresources",
      name: "test-resource",
    };

    const mockResponse = {
      body: {
        metadata: { name: "test-resource" },
      },
    };

    mockClientCustomObjectsApi.getNamespacedCustomObject.mockResolvedValueOnce(
      mockResponse
    );

    const caller = createCaller(mockContext);
    const result = await caller.k8s.get(input);

    expect(
      mockClientCustomObjectsApi.getNamespacedCustomObject
    ).toHaveBeenCalledWith({
      group: input.group,
      version: input.version,
      plural: input.resourcePlural,
      namespace: input.namespace,
      name: input.name,
    });
    expect(result).toEqual(mockResponse);
  });

  it("should throw validation error for missing required input fields", async () => {
    const invalidInput = {
      clusterName: "test-cluster",
      group: "test.group.io",
      // version missing
      namespace: "test-namespace",
      resourcePlural: "testresources",
      // name missing
    };

    const caller = createCaller(mockContext);

    await expect(
      caller.k8s.get(
        invalidInput as inferProcedureInput<typeof k8sGetProcedure>
      )
    ).rejects.toThrowError();
  });

  it("should throw error when Kubernetes API returns 403 Forbidden", async () => {
    const input = {
      clusterName: "test-cluster",
      group: "test.group.io",
      version: "v1",
      namespace: "test-namespace",
      resourcePlural: "testresources",
      name: "test-resource",
    };

    const errorResponse = {
      statusCode: 403,
      message: "Forbidden: User lacks permission",
    };

    mockClientCustomObjectsApi.getNamespacedCustomObject.mockRejectedValueOnce(
      errorResponse
    );

    const caller = createCaller(mockContext);

    await expect(caller.k8s.get(input)).rejects.toThrow(
      "Forbidden: User lacks permission"
    );
  });

  it("should handle Kubernetes API network errors", async () => {
    const input = {
      clusterName: "test-cluster",
      group: "test.group.io",
      version: "v1",
      namespace: "test-namespace",
      resourcePlural: "testresources",
      name: "test-resource",
    };

    mockClientCustomObjectsApi.getNamespacedCustomObject.mockRejectedValueOnce(
      new Error("Network error: Failed to connect to Kubernetes API")
    );

    const caller = createCaller(mockContext);

    await expect(caller.k8s.get(input)).rejects.toThrow(
      "Network error: Failed to connect to Kubernetes API"
    );
  });
});
