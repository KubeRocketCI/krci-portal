import { createMockedContext } from "../../../../../__mocks__/context";
import { createCaller } from "../../../../../routers";
import { inferProcedureInput } from "@trpc/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { k8sGetProcedure } from ".";

describe("k8sGetProcedure", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should call getResource with correct parameters", async () => {
    const input = {
      clusterName: "test-cluster",
      namespace: "test-namespace",
      name: "test-resource",
      resourceConfig: {
        group: "test.group.io",
        version: "v1",
        pluralName: "testresources",
        kind: "TestResource",
        singularName: "testresource",
        apiVersion: "test.group.io/v1",
      },
    };

    const mockResponse = {
      metadata: { name: "test-resource" },
    };

    mockContext.K8sClient.getResource.mockResolvedValueOnce(mockResponse);

    const caller = createCaller(mockContext);
    const result = await caller.k8s.get(input);

    expect(mockContext.K8sClient.getResource).toHaveBeenCalledWith(input.resourceConfig, input.name, input.namespace);
    expect(result).toEqual(mockResponse);
  });

  it("should throw validation error for missing required input fields", async () => {
    const invalidInput = {
      clusterName: "test-cluster",
      // resourceConfig missing
      namespace: "test-namespace",
      // name missing
    };

    const caller = createCaller(mockContext);

    await expect(caller.k8s.get(invalidInput as inferProcedureInput<typeof k8sGetProcedure>)).rejects.toThrowError();
  });

  it("should throw error when K8sClient.getResource throws an error", async () => {
    const input = {
      clusterName: "test-cluster",
      namespace: "test-namespace",
      name: "test-resource",
      resourceConfig: {
        group: "test.group.io",
        version: "v1",
        pluralName: "testresources",
        kind: "TestResource",
        singularName: "testresource",
        apiVersion: "test.group.io/v1",
      },
    };

    const errorResponse = new Error("Forbidden: User lacks permission");

    mockContext.K8sClient.getResource.mockRejectedValueOnce(errorResponse);

    const caller = createCaller(mockContext);

    await expect(caller.k8s.get(input)).rejects.toThrow("Forbidden: User lacks permission");
  });
});
