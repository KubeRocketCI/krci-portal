import { createCaller } from "@/trpc/routers";
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { kubeRootConfigName } from ".";
import { createMockedContext } from "@/__mocks__/context";

const validGetCurrentClusterOutput = {
  name: "test-cluster",
  server: "https://test-cluster.example.com",
  caData: "dGVzdC1jYS1kYXRh",
};

const invalidGetCurrentClusterOutput = {
  name: "test-cluster",
  server: "https://test-cluster.example.com",
};

const validGetCurrentUserOutput = {
  token: "test-token",
};

const validReadNamespacedConfigMapOutput = {
  kind: "ConfigMap",
  apiVersion: "v1",
  data: {
    ["ca.crt"]: "test-ca-data",
  },
};

const invalidReadNamespacedConfigMapOutput = {
  kind: "ConfigMap",
  apiVersion: "v1",
  data: {}, // no ca.crt field
};

describe("k8sGetKubeConfig", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  let mockClientCoreApi: {
    readNamespacedConfigMap: Mock;
  };

  beforeEach(() => {
    mockContext = createMockedContext();

    // Create mock CoreApi instance
    mockClientCoreApi = {
      readNamespacedConfigMap: vi.fn(),
    };

    // Configure makeApiClient to return the mock CoreApi
    mockContext.K8sClient.KubeConfig.makeApiClient.mockReturnValue(
      mockClientCoreApi
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should call getKubeConfig and return kubeconfig", async () => {
    mockContext.K8sClient.KubeConfig.getCurrentCluster.mockReturnValueOnce(
      validGetCurrentClusterOutput
    );
    mockContext.K8sClient.KubeConfig.getCurrentUser.mockReturnValueOnce(
      validGetCurrentUserOutput
    );

    const caller = createCaller(mockContext);
    const result = await caller.k8s.kubeconfig();

    expect(result).toEqual({
      apiVersion: "v1",
      kind: "Config",
      "current-context": "test-cluster",
      clusters: [
        {
          name: "test-cluster",
          cluster: {
            server: "https://test-cluster.example.com",
            "certificate-authority-data": "dGVzdC1jYS1kYXRh",
          },
        },
      ],
      users: [{ name: "john_doe@world.com", user: { token: "test-token" } }],
      contexts: [
        {
          name: "test-cluster",
          context: { cluster: "test-cluster", user: "john_doe@world.com" },
        },
      ],
    });
  });

  it("should call return kubeconfig with caData from kube-system config-map if kubeconfig's caData is not available", async () => {
    mockContext.K8sClient.KubeConfig.getCurrentCluster.mockReturnValueOnce(
      invalidGetCurrentClusterOutput
    );
    mockContext.K8sClient.KubeConfig.getCurrentUser.mockReturnValueOnce(
      validGetCurrentUserOutput
    );

    mockClientCoreApi.readNamespacedConfigMap.mockResolvedValueOnce(
      validReadNamespacedConfigMapOutput
    );

    const caller = createCaller(mockContext);
    const result = await caller.k8s.kubeconfig();

    expect(mockClientCoreApi.readNamespacedConfigMap).toHaveBeenCalledWith({
      name: kubeRootConfigName,
      namespace: "kube-system",
    });

    expect(result).toEqual({
      apiVersion: "v1",
      kind: "Config",
      "current-context": "test-cluster",
      clusters: [
        {
          name: "test-cluster",
          cluster: {
            server: "https://test-cluster.example.com",
            "certificate-authority-data": "dGVzdC1jYS1kYXRh",
          },
        },
      ],
      users: [{ name: "john_doe@world.com", user: { token: "test-token" } }],
      contexts: [
        {
          name: "test-cluster",
          context: { cluster: "test-cluster", user: "john_doe@world.com" },
        },
      ],
    });
  });

  it("should throw errors if missing some of the kubeconfig data", async () => {
    mockContext.K8sClient.KubeConfig.getCurrentCluster.mockReturnValueOnce(
      undefined
    );
    mockContext.K8sClient.KubeConfig.getCurrentUser.mockReturnValueOnce(
      undefined
    );

    const caller = createCaller(mockContext);
    await expect(caller.k8s.kubeconfig()).rejects.toThrowError(
      "Invalid KubeConfig: missing cluster or user info"
    );
  });

  it("should throw errors if missing ca.crt field in kube-root-ca.crt ConfigMap", async () => {
    mockContext.K8sClient.KubeConfig.getCurrentCluster.mockReturnValueOnce(
      invalidGetCurrentClusterOutput
    );
    mockContext.K8sClient.KubeConfig.getCurrentUser.mockReturnValueOnce(
      validGetCurrentUserOutput
    );

    mockClientCoreApi.readNamespacedConfigMap.mockResolvedValueOnce(
      invalidReadNamespacedConfigMapOutput
    );

    const caller = createCaller(mockContext);
    await expect(caller.k8s.kubeconfig()).rejects.toThrowError(
      "CA certificate not found in config map"
    );
  });
});
