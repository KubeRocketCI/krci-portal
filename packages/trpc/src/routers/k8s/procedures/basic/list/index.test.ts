import { createMockedContext } from "../../../../../__mocks__/context.js";
import { createCaller } from "../../../../../routers/index.js";
import { inferProcedureInput } from "@trpc/server";
import { afterEach, beforeEach, describe, expect, it, vi, Mock } from "vitest";
import { k8sListProcedure } from "./index.js";
import { K8sClient } from "../../../../../clients/k8s/index.js";

// Mock K8sClient at module level
vi.mock("../../../../../clients/k8s/index.js", () => {
  return {
    K8sClient: vi.fn(),
  };
});

describe("k8sListProcedure", () => {
  let mockContext: ReturnType<typeof createMockedContext>;
  let mockK8sClientInstance: {
    KubeConfig: {};
    listResource: Mock;
  };

  beforeEach(() => {
    mockContext = createMockedContext();

    // Create mock K8sClient instance
    mockK8sClientInstance = {
      KubeConfig: {},
      listResource: vi.fn(),
    };

    // Mock K8sClient constructor
    (K8sClient as unknown as Mock).mockImplementation(() => mockK8sClientInstance);
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

    mockK8sClientInstance.listResource.mockResolvedValueOnce(mockResponse);

    const caller = createCaller(mockContext);
    const result = await caller.k8s.list(input);

    expect(mockK8sClientInstance.listResource).toHaveBeenCalledWith(input.resourceConfig, input.namespace, "");
    expect(result).toEqual(mockResponse);
  });

  it("should throw validation error for missing required input fields", async () => {
    const invalidInput = {
      clusterName: "test-cluster",
      // resourceConfig missing
      namespace: "test-namespace",
    };

    const caller = createCaller(mockContext);

    await expect(caller.k8s.list(invalidInput as inferProcedureInput<typeof k8sListProcedure>)).rejects.toThrowError();
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

    mockK8sClientInstance.listResource.mockRejectedValueOnce(errorResponse);

    const caller = createCaller(mockContext);

    await expect(caller.k8s.list(input)).rejects.toThrow("Forbidden: User lacks permission");
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

    mockK8sClientInstance.listResource.mockRejectedValueOnce(
      new Error("Network error: Failed to connect to Kubernetes API")
    );

    const caller = createCaller(mockContext);

    await expect(caller.k8s.list(input)).rejects.toThrow("Network error: Failed to connect to Kubernetes API");
  });
});
