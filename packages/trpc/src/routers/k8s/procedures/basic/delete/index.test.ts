import { createMockedContext } from "../../../../../__mocks__/context.js";
import { createCaller } from "../../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi, Mock } from "vitest";
import { K8sClient } from "../../../../../clients/k8s/index.js";

vi.mock("../../../../../clients/k8s/index.js", () => {
  return {
    K8sClient: vi.fn(),
  };
});

describe("k8sDeleteItemProcedure", () => {
  let mockContext: ReturnType<typeof createMockedContext>;
  let mockK8sClientInstance: {
    KubeConfig: {};
    deleteResource: Mock;
  };

  beforeEach(() => {
    mockContext = createMockedContext();
    mockK8sClientInstance = {
      KubeConfig: {},
      deleteResource: vi.fn(),
    };
    (K8sClient as unknown as Mock).mockImplementation(() => mockK8sClientInstance);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const resourceConfig = {
    group: "test.group.io",
    version: "v1",
    pluralName: "testresources",
    kind: "TestResource",
    singularName: "testresource",
    apiVersion: "test.group.io/v1",
  };

  it("should call deleteResource with correct parameters", async () => {
    const input = {
      clusterName: "test-cluster",
      namespace: "test-namespace",
      name: "test-resource",
      resource: {},
      resourceConfig,
    };

    const mockResponse = { status: "Success" };
    mockK8sClientInstance.deleteResource.mockResolvedValueOnce(mockResponse);

    const caller = createCaller(mockContext);
    const result = await caller.k8s.delete(input);

    expect(mockK8sClientInstance.deleteResource).toHaveBeenCalledWith(
      input.resourceConfig,
      input.name,
      input.namespace
    );
    expect(result).toEqual(mockResponse);
  });

  it("should throw validation error for missing required input fields", async () => {
    const caller = createCaller(mockContext);
    await expect(caller.k8s.delete({ clusterName: "test" } as any)).rejects.toThrowError();
  });

  it("should throw error when K8sClient.deleteResource throws", async () => {
    const input = {
      clusterName: "test-cluster",
      namespace: "test-namespace",
      name: "test-resource",
      resource: {},
      resourceConfig,
    };

    mockK8sClientInstance.deleteResource.mockRejectedValueOnce(new Error("Not Found"));

    const caller = createCaller(mockContext);
    await expect(caller.k8s.delete(input)).rejects.toThrow("Not Found");
  });
});
