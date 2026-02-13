import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi, Mock } from "vitest";
import { K8sClient } from "../../../../clients/k8s/index.js";

vi.mock("../../../../clients/k8s/index.js", () => ({
  K8sClient: vi.fn(),
}));

describe("k8s.getKubeConfig", () => {
  let mockContext: ReturnType<typeof createMockedContext>;
  let mockListResource: Mock;

  beforeEach(() => {
    mockContext = createMockedContext();
    mockListResource = vi.fn();
    (K8sClient as unknown as Mock).mockImplementation(() => ({
      KubeConfig: {
        getCurrentCluster: () => ({
          name: "test-cluster",
          server: "https://api.example.com",
          caData: "Y2EtZGF0YQ==",
        }),
        getCurrentUser: () => ({
          token: "user-token",
        }),
      },
      listResource: mockListResource,
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should throw when KubeConfig is not initialized", async () => {
    (K8sClient as unknown as Mock).mockImplementation(() => ({
      KubeConfig: null,
    }));

    mockContext.session.user = {
      ...mockContext.session.user,
      secret: { accessToken: "token", accessTokenExpiresAt: 0 },
    } as any;

    mockListResource.mockResolvedValueOnce({
      items: [
        {
          metadata: { name: "krci-config" },
          data: { api_cluster_endpoint: "https://api.cluster.svc" },
        },
      ],
    });

    const caller = createCaller(mockContext);
    await expect(caller.k8s.kubeconfig({ namespace: "default" })).rejects.toThrow();
  });

  it("should return kube config when client is initialized", async () => {
    mockContext.session.user = {
      data: { email: "user@example.com" },
      secret: { accessToken: "token", accessTokenExpiresAt: 0 },
    } as any;
    mockListResource.mockResolvedValueOnce({
      items: [
        {
          metadata: { name: "krci-config" },
          data: { api_cluster_endpoint: "https://api.cluster.svc" },
        },
      ],
    });

    const caller = createCaller(mockContext);
    const result = await caller.k8s.kubeconfig({ namespace: "default" });

    expect(result.config).toBeDefined();
    expect(result.config.clusters).toHaveLength(1);
    expect(result.config.clusters[0].cluster.server).toBe("https://api.cluster.svc");
    expect(result.config["current-context"]).toBe("test-cluster");
  });
});
