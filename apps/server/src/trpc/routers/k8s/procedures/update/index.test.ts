import { createMockedContext } from "@/__mocks__/context";
import { createCaller } from "@/trpc/routers";
import { KubeObjectBase } from "@my-project/shared";
import { inferProcedureInput } from "@trpc/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { k8sUpdateItemProcedure } from ".";

const validInput = {
  clusterName: "test-cluster",
  group: "test.group.io",
  version: "v1",
  namespace: "test-namespace",
  resourcePlural: "testresources",
  name: "test-resource",
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
  // name is missing
  // resource is missing
};

describe("k8sUpdateProcedure", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  let mockClientCustomObjectsApi: {
    patchNamespacedCustomObject: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockContext = createMockedContext();

    // Create mock ApisApi instance
    mockClientCustomObjectsApi = {
      patchNamespacedCustomObject: vi.fn(),
    };

    // Configure makeApiClient to return the mock ApisApi
    mockContext.K8sClient.KubeConfig.makeApiClient.mockReturnValue(
      mockClientCustomObjectsApi
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should call patchNamespacedCustomObject with correct parameters", async () => {
    const mockResponse = true;

    mockClientCustomObjectsApi.patchNamespacedCustomObject.mockResolvedValueOnce(
      mockResponse
    );

    const caller = createCaller(mockContext);
    const result = await caller.k8s.update(validInput);

    expect(
      mockClientCustomObjectsApi.patchNamespacedCustomObject
    ).toHaveBeenCalledWith({
      group: validInput.group,
      version: validInput.version,
      plural: validInput.resourcePlural,
      namespace: validInput.namespace,
      body: validInput.resource,
      name: validInput.name,
    });
    expect(result).toEqual(mockResponse);
  });

  it("should throw validation error for missing required input fields", async () => {
    const caller = createCaller(mockContext);

    await expect(
      caller.k8s.update(
        invalidInput as inferProcedureInput<typeof k8sUpdateItemProcedure>
      )
    ).rejects.toThrowError();
  });

  it("should throw error when Kubernetes API returns 403 Forbidden", async () => {
    const errorResponse = {
      statusCode: 403,
      message: "Forbidden: User lacks permission",
    };

    mockClientCustomObjectsApi.patchNamespacedCustomObject.mockRejectedValueOnce(
      errorResponse
    );

    const caller = createCaller(mockContext);

    await expect(caller.k8s.update(validInput)).rejects.toThrow(
      "Forbidden: User lacks permission"
    );
  });

  it("should handle Kubernetes API network errors", async () => {
    mockClientCustomObjectsApi.patchNamespacedCustomObject.mockRejectedValueOnce(
      new Error("Network error: Failed to connect to Kubernetes API")
    );

    const caller = createCaller(mockContext);

    await expect(caller.k8s.update(validInput)).rejects.toThrow(
      "Network error: Failed to connect to Kubernetes API"
    );
  });
});
