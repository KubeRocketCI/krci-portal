import { createMockedContext } from "@/__mocks__/context";
import { createCaller } from "@/trpc/routers";
import { inferProcedureInput } from "@trpc/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { k8sDeleteItemProcedure } from ".";

describe("k8sDeleteProcedure", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  let mockClientCustomObjectsApi: {
    deleteNamespacedCustomObject: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockContext = createMockedContext();

    // Create mock ApisApi instance
    mockClientCustomObjectsApi = {
      deleteNamespacedCustomObject: vi.fn(),
    };

    // Configure makeApiClient to return the mock ApisApi
    mockContext.K8sClient.KubeConfig.makeApiClient.mockReturnValue(
      mockClientCustomObjectsApi
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should call deleteNamespacedCustomObject with correct parameters", async () => {
    const input = {
      clusterName: "test-cluster",
      group: "test.group.io",
      version: "v1",
      namespace: "test-namespace",
      resourcePlural: "testresources",
      name: "test-resource",
    };

    const mockResponse = true;

    mockClientCustomObjectsApi.deleteNamespacedCustomObject.mockResolvedValueOnce(
      mockResponse
    );

    const caller = createCaller(mockContext);
    const result = await caller.k8s.delete(input);

    expect(
      mockClientCustomObjectsApi.deleteNamespacedCustomObject
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
      caller.k8s.delete(
        invalidInput as inferProcedureInput<typeof k8sDeleteItemProcedure>
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

    mockClientCustomObjectsApi.deleteNamespacedCustomObject.mockRejectedValueOnce(
      errorResponse
    );

    const caller = createCaller(mockContext);

    await expect(caller.k8s.delete(input)).rejects.toThrow(
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

    mockClientCustomObjectsApi.deleteNamespacedCustomObject.mockRejectedValueOnce(
      new Error("Network error: Failed to connect to Kubernetes API")
    );

    const caller = createCaller(mockContext);

    await expect(caller.k8s.delete(input)).rejects.toThrow(
      "Network error: Failed to connect to Kubernetes API"
    );
  });
});
