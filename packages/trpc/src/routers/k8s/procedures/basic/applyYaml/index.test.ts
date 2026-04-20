import { createMockedContext } from "../../../../../__mocks__/context.js";
import { createCaller } from "../../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi, Mock } from "vitest";
import { K8sClient } from "../../../../../clients/k8s/index.js";

vi.mock("../../../../../clients/k8s/index.js", () => ({
  K8sClient: vi.fn(),
}));

describe("k8sApplyYamlProcedure", () => {
  let mockContext: ReturnType<typeof createMockedContext>;
  let mockK8sClientInstance: {
    KubeConfig: object;
    discoverResource: Mock;
    createResource: Mock;
  };

  beforeEach(() => {
    mockContext = createMockedContext();
    mockK8sClientInstance = {
      KubeConfig: {},
      discoverResource: vi.fn(),
      createResource: vi.fn(),
    };
    (K8sClient as unknown as Mock).mockImplementation(() => mockK8sClientInstance);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const configMapResource = {
    apiVersion: "v1",
    kind: "ConfigMap",
    metadata: { name: "my-config", namespace: "test-ns" },
    data: { key: "value" },
  };

  const deploymentResource = {
    apiVersion: "apps/v1",
    kind: "Deployment",
    metadata: { name: "my-deploy", namespace: "test-ns" },
    spec: {},
  };

  it("creates a single resource successfully", async () => {
    mockK8sClientInstance.discoverResource.mockResolvedValue({ pluralName: "configmaps", namespaced: true });
    mockK8sClientInstance.createResource.mockResolvedValue({ metadata: { name: "my-config" } });

    const caller = createCaller(mockContext);
    const result = await caller.k8s.applyYaml({
      clusterName: "test-cluster",
      resources: [configMapResource],
    });

    expect(result).toEqual([{ success: true, kind: "ConfigMap", name: "my-config" }]);
    expect(mockK8sClientInstance.discoverResource).toHaveBeenCalledWith("v1", "ConfigMap");
    expect(mockK8sClientInstance.createResource).toHaveBeenCalledWith(
      expect.objectContaining({ pluralName: "configmaps", group: "", version: "v1" }),
      "test-ns",
      configMapResource
    );
  });

  it("applies multiple resources and returns results for each", async () => {
    mockK8sClientInstance.discoverResource
      .mockResolvedValueOnce({ pluralName: "configmaps", namespaced: true })
      .mockResolvedValueOnce({ pluralName: "deployments", namespaced: true });
    mockK8sClientInstance.createResource.mockResolvedValue({});

    const caller = createCaller(mockContext);
    const result = await caller.k8s.applyYaml({
      clusterName: "test-cluster",
      resources: [configMapResource, deploymentResource],
    });

    expect(result).toEqual([
      { success: true, kind: "ConfigMap", name: "my-config" },
      { success: true, kind: "Deployment", name: "my-deploy" },
    ]);
    expect(mockK8sClientInstance.createResource).toHaveBeenCalledTimes(2);
  });

  it("returns partial failure when one resource fails", async () => {
    mockK8sClientInstance.discoverResource
      .mockResolvedValueOnce({ pluralName: "configmaps", namespaced: true })
      .mockRejectedValueOnce(new Error('Resource kind "Deployment" not found'));
    mockK8sClientInstance.createResource.mockResolvedValue({});

    const caller = createCaller(mockContext);
    const result = await caller.k8s.applyYaml({
      clusterName: "test-cluster",
      resources: [configMapResource, deploymentResource],
    });

    expect(result[0].success).toBe(true);
    expect(result[1].success).toBe(false);
    expect(result[1].error).toMatch(/Deployment/);
  });

  it("derives correct group and version from grouped apiVersion", async () => {
    mockK8sClientInstance.discoverResource.mockResolvedValue({ pluralName: "deployments", namespaced: true });
    mockK8sClientInstance.createResource.mockResolvedValue({});

    const caller = createCaller(mockContext);
    await caller.k8s.applyYaml({ clusterName: "test-cluster", resources: [deploymentResource] });

    expect(mockK8sClientInstance.createResource).toHaveBeenCalledWith(
      expect.objectContaining({ group: "apps", version: "v1", apiVersion: "apps/v1" }),
      "test-ns",
      deploymentResource
    );
  });

  it("passes undefined namespace for cluster-scoped resources", async () => {
    const clusterScopedResource = {
      apiVersion: "v1",
      kind: "Namespace",
      metadata: { name: "my-namespace" },
    };
    mockK8sClientInstance.discoverResource.mockResolvedValue({ pluralName: "namespaces", namespaced: false });
    mockK8sClientInstance.createResource.mockResolvedValue({});

    const caller = createCaller(mockContext);
    await caller.k8s.applyYaml({ clusterName: "test-cluster", resources: [clusterScopedResource] });

    expect(mockK8sClientInstance.createResource).toHaveBeenCalledWith(
      expect.anything(),
      undefined,
      clusterScopedResource
    );
  });

  it("returns error result for resource missing apiVersion or kind", async () => {
    const caller = createCaller(mockContext);
    const result = await caller.k8s.applyYaml({
      clusterName: "test-cluster",
      resources: [{ metadata: { name: "bad" } }],
    });

    expect(result).toEqual([{ success: false, error: "Resource is missing apiVersion or kind" }]);
    expect(mockK8sClientInstance.discoverResource).not.toHaveBeenCalled();
  });

  it("throws when K8sClient has no KubeConfig", async () => {
    mockK8sClientInstance.KubeConfig = null as unknown as object;

    const caller = createCaller(mockContext);
    await expect(
      caller.k8s.applyYaml({ clusterName: "test-cluster", resources: [configMapResource] })
    ).rejects.toThrow();
  });
});
