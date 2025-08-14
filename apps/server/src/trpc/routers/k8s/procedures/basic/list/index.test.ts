import { createMockedContext } from "@/__mocks__/context";
import { createCaller } from "@/trpc/routers";
import { inferProcedureInput } from "@trpc/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { k8sListProcedure } from ".";

describe("k8sListProcedure", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should call listResource with correct parameters", async () => {
    const input = {
      clusterName: "test-cluster",
      namespace: "test-namespace",
      resourceConfig: {
        group: "test.group.io",
        version: "v1",
        pluralName: "testresources",
        kind: "TestResource",
        singularName: "testresource",
        apiVersion: "test.group.io/v1",
      },
      labels: {},
    };

    const mockResponse = {
      items: [{ metadata: { name: "test-resource" } }],
    };

    mockContext.K8sClient.listResource.mockResolvedValueOnce(mockResponse);

    const caller = createCaller(mockContext);
    const result = await caller.k8s.list(input);

    expect(mockContext.K8sClient.listResource).toHaveBeenCalledWith(
      input.resourceConfig,
      input.namespace,
      ""
    );
    expect(result).toEqual(mockResponse);
  });

  it("should throw validation error for missing required input fields", async () => {
    const invalidInput = {
      clusterName: "test-cluster",
      // resourceConfig missing
      namespace: "test-namespace",
    };

    const caller = createCaller(mockContext);

    await expect(
      caller.k8s.list(
        invalidInput as inferProcedureInput<typeof k8sListProcedure>
      )
    ).rejects.toThrowError();
  });

  it("should throw error when K8sClient.listResource throws an error", async () => {
    const input = {
      clusterName: "test-cluster",
      namespace: "test-namespace",
      resourceConfig: {
        group: "test.group.io",
        version: "v1",
        pluralName: "testresources",
        kind: "TestResource",
        singularName: "testresource",
        apiVersion: "test.group.io/v1",
      },
      labels: {},
    };

    const errorResponse = new Error("Forbidden: User lacks permission");

    mockContext.K8sClient.listResource.mockRejectedValueOnce(errorResponse);

    const caller = createCaller(mockContext);

    await expect(caller.k8s.list(input)).rejects.toThrow(
      "Forbidden: User lacks permission"
    );
  });

  it("should handle K8sClient network errors", async () => {
    const input = {
      clusterName: "test-cluster",
      namespace: "test-namespace",
      resourceConfig: {
        group: "test.group.io",
        version: "v1",
        pluralName: "testresources",
        kind: "TestResource",
        singularName: "testresource",
        apiVersion: "test.group.io/v1",
      },
      labels: {},
    };

    mockContext.K8sClient.listResource.mockRejectedValueOnce(
      new Error("Network error: Failed to connect to Kubernetes API")
    );

    const caller = createCaller(mockContext);

    await expect(caller.k8s.list(input)).rejects.toThrow(
      "Network error: Failed to connect to Kubernetes API"
    );
  });
});
