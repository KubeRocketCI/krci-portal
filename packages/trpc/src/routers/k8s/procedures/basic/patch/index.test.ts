import { createMockedContext } from "../../../../../__mocks__/context.js";
import { createCaller } from "../../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi, Mock } from "vitest";
import { K8sClient } from "../../../../../clients/k8s/index.js";

vi.mock("../../../../../clients/k8s/index.js", () => {
  return {
    K8sClient: vi.fn(),
  };
});

describe("k8sPatchItemProcedure", () => {
  let mockContext: ReturnType<typeof createMockedContext>;
  let mockK8sClientInstance: {
    KubeConfig: {};
    replaceResource: Mock;
  };

  beforeEach(() => {
    mockContext = createMockedContext();
    mockK8sClientInstance = {
      KubeConfig: {},
      replaceResource: vi.fn(),
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

  it("should call replaceResource with correct parameters", async () => {
    const input = {
      clusterName: "test-cluster",
      namespace: "test-namespace",
      name: "test-resource",
      resource: { metadata: { name: "test-resource" }, spec: {} },
      resourceConfig,
    };

    const mockResponse = { metadata: { name: "test-resource" } };
    mockK8sClientInstance.replaceResource.mockResolvedValueOnce(mockResponse);

    const caller = createCaller(mockContext);
    const result = await caller.k8s.patch(input);

    expect(mockK8sClientInstance.replaceResource).toHaveBeenCalledWith(
      input.resourceConfig,
      input.name,
      input.namespace,
      input.resource
    );
    expect(result).toEqual(mockResponse);
  });

  it("should throw validation error for missing required input fields", async () => {
    const caller = createCaller(mockContext);
    await expect(caller.k8s.patch({ clusterName: "test" } as any)).rejects.toThrowError();
  });

  it("should throw error when K8sClient.replaceResource throws", async () => {
    const input = {
      clusterName: "test-cluster",
      namespace: "test-namespace",
      name: "test-resource",
      resource: { metadata: { name: "test-resource" } },
      resourceConfig,
    };

    mockK8sClientInstance.replaceResource.mockRejectedValueOnce(new Error("Conflict"));

    const caller = createCaller(mockContext);
    await expect(caller.k8s.patch(input)).rejects.toThrow("Conflict");
  });
});
