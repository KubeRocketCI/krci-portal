import { createMockedContext } from "@/__mocks__/context";
import { createCaller } from "@/trpc/routers";
import { inferProcedureInput } from "@trpc/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { k8sListProcedure } from ".";

describe("k8sListProcedure", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  let mockClientCustomObjectsApi: {
    listNamespacedCustomObject: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockContext = createMockedContext();

    // Create mock ApisApi instance
    mockClientCustomObjectsApi = {
      listNamespacedCustomObject: vi.fn(),
    };

    // Configure makeApiClient to return the mock ApisApi
    mockContext.K8sClient.KubeConfig.makeApiClient.mockReturnValue(
      mockClientCustomObjectsApi
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should call listNamespacedCustomObject with correct parameters", async () => {
    const input = {
      clusterName: "test-cluster",
      group: "test.group.io",
      version: "v1",
      namespace: "test-namespace",
      resourcePlural: "testresources",
    };

    const mockResponse = {
      body: {
        items: [{ metadata: { name: "test-resource" } }],
      },
    };

    mockClientCustomObjectsApi.listNamespacedCustomObject.mockResolvedValueOnce(
      mockResponse
    );

    const caller = createCaller(mockContext);
    const result = await caller.k8s.list(input);

    expect(
      mockClientCustomObjectsApi.listNamespacedCustomObject
    ).toHaveBeenCalledWith({
      group: input.group,
      version: input.version,
      plural: input.resourcePlural,
      namespace: input.namespace,
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
    };

    const caller = createCaller(mockContext);

    await expect(
      caller.k8s.list(
        invalidInput as inferProcedureInput<typeof k8sListProcedure>
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
    };

    const errorResponse = {
      statusCode: 403,
      message: "Forbidden: User lacks permission",
    };

    mockClientCustomObjectsApi.listNamespacedCustomObject.mockRejectedValueOnce(
      errorResponse
    );

    const caller = createCaller(mockContext);

    await expect(caller.k8s.list(input)).rejects.toThrow(
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
    };

    mockClientCustomObjectsApi.listNamespacedCustomObject.mockRejectedValueOnce(
      new Error("Network error: Failed to connect to Kubernetes API")
    );

    const caller = createCaller(mockContext);

    await expect(caller.k8s.list(input)).rejects.toThrow(
      "Network error: Failed to connect to Kubernetes API"
    );
  });
});
