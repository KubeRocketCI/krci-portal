import { createMockedContext } from "../../../../../__mocks__/context.js";
import { createCaller } from "../../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi, Mock } from "vitest";
import { K8sClient } from "../../../../../clients/k8s/index.js";

vi.mock("../../../../../clients/k8s/index.js", () => {
  return {
    K8sClient: vi.fn(),
  };
});

describe("k8sCreateItemProcedure", () => {
  let mockContext: ReturnType<typeof createMockedContext>;
  let mockK8sClientInstance: {
    KubeConfig: {};
    createResource: Mock;
  };

  beforeEach(() => {
    mockContext = createMockedContext();
    mockK8sClientInstance = {
      KubeConfig: {},
      createResource: vi.fn(),
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

  it("should call createResource with correct parameters", async () => {
    const input = {
      clusterName: "test-cluster",
      namespace: "test-namespace",
      resource: { metadata: { name: "test" } },
      resourceConfig,
    };

    const mockResponse = { metadata: { name: "test" } };
    mockK8sClientInstance.createResource.mockResolvedValueOnce(mockResponse);

    const caller = createCaller(mockContext);
    const result = await caller.k8s.create(input);

    expect(mockK8sClientInstance.createResource).toHaveBeenCalledWith(
      input.resourceConfig,
      input.namespace,
      input.resource
    );
    expect(result).toEqual(mockResponse);
  });

  it("should throw validation error for missing required input fields", async () => {
    const caller = createCaller(mockContext);
    await expect(caller.k8s.create({ clusterName: "test" } as any)).rejects.toThrowError();
  });

  it("should throw error when K8sClient.createResource throws", async () => {
    const input = {
      clusterName: "test-cluster",
      namespace: "test-namespace",
      resource: { metadata: { name: "test" } },
      resourceConfig,
    };

    mockK8sClientInstance.createResource.mockRejectedValueOnce(new Error("Forbidden"));

    const caller = createCaller(mockContext);
    await expect(caller.k8s.create(input)).rejects.toThrow("Forbidden");
  });
});
