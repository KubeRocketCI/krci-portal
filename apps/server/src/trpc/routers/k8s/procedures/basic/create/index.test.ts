import { createMockedContext } from "@/__mocks__/context";
import { createCaller } from "@/trpc/routers";
import { KubeObjectBase } from "@my-project/shared";
import { inferProcedureInput } from "@trpc/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { k8sCreateItemProcedure } from ".";

describe("k8sCreateProcedure", () => {
  const validInput = {
    clusterName: "test-cluster",
    group: "test.group.io",
    version: "v1",
    namespace: "test-namespace",
    resourcePlural: "testresources",
    resource: {
      apiVersion: "test.group.io/v1",
      kind: "TestResource",
      metadata: {
        name: "test-resource",
        namespace: "test-namespace",
      } as KubeObjectBase["metadata"],
    },
  };

  const invalidInput = {
    clusterName: "test-cluster",
    group: "test.group.io",
    version: "v1",
    namespace: "test-namespace",
    resourcePlural: "testresources",
    // resource is missing
  };

  let mockContext: ReturnType<typeof createMockedContext>;

  let mockClientCustomObjectsApi: {
    createNamespacedCustomObject: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockContext = createMockedContext();

    // Create mock ApisApi instance
    mockClientCustomObjectsApi = {
      createNamespacedCustomObject: vi.fn(),
    };

    // Configure makeApiClient to return the mock ApisApi
    mockContext.K8sClient.KubeConfig.makeApiClient.mockReturnValue(
      mockClientCustomObjectsApi
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should call createNamespacedCustomObject with correct parameters", async () => {
    const mockResponse = true;

    mockClientCustomObjectsApi.createNamespacedCustomObject.mockResolvedValueOnce(
      mockResponse
    );

    const caller = createCaller(mockContext);
    const result = await caller.k8s.create(validInput);

    expect(
      mockClientCustomObjectsApi.createNamespacedCustomObject
    ).toHaveBeenCalledWith({
      group: validInput.group,
      version: validInput.version,
      plural: validInput.resourcePlural,
      namespace: validInput.namespace,
      body: validInput.resource,
    });
    expect(result).toEqual(mockResponse);
  });

  it("should throw validation error for missing required input fields", async () => {
    const caller = createCaller(mockContext);

    await expect(
      caller.k8s.create(
        invalidInput as inferProcedureInput<typeof k8sCreateItemProcedure>
      )
    ).rejects.toThrowError();
  });

  it("should throw error when Kubernetes API returns 403 Forbidden", async () => {
    const errorResponse = {
      statusCode: 403,
      message: "Forbidden: User lacks permission",
    };

    mockClientCustomObjectsApi.createNamespacedCustomObject.mockRejectedValueOnce(
      errorResponse
    );

    const caller = createCaller(mockContext);

    await expect(caller.k8s.create(validInput)).rejects.toThrow(
      "Forbidden: User lacks permission"
    );
  });

  it("should handle Kubernetes API network errors", async () => {
    mockClientCustomObjectsApi.createNamespacedCustomObject.mockRejectedValueOnce(
      new Error("Network error: Failed to connect to Kubernetes API")
    );

    const caller = createCaller(mockContext);

    await expect(caller.k8s.create(validInput)).rejects.toThrow(
      "Network error: Failed to connect to Kubernetes API"
    );
  });
});
