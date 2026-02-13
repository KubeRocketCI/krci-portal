import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi, Mock } from "vitest";
import { K8sClient } from "../../../../clients/k8s/index.js";

vi.mock("../../../../clients/k8s/index.js", () => ({
  K8sClient: vi.fn(),
}));

describe("k8s.getClusterDetails", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
    (K8sClient as unknown as Mock).mockImplementation(() => ({
      KubeConfig: {
        getCurrentCluster: () => ({
          name: "my-cluster",
          server: "https://api.cluster.example.com",
        }),
        getCurrentContext: () => "my-context",
        makeApiClient: () => ({
          getCode: () =>
            Promise.resolve({
              gitVersion: "v1.28.0",
              platform: "linux/amd64",
              goVersion: "go1.21.0",
            }),
        }),
      },
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return cluster details", async () => {
    const caller = createCaller(mockContext);
    const result = await caller.k8s.clusterDetails();

    expect(result.clusterName).toBeDefined();
    expect(result.apiServerUrl).toBe("https://api.cluster.example.com");
    expect(result.defaultNamespace).toBeDefined();
    expect(result.gitVersion).toBe("v1.28.0");
    expect(result.platform).toBe("linux/amd64");
    expect(result.goVersion).toBe("go1.21.0");
  });

  it("should throw when KubeConfig is not initialized", async () => {
    (K8sClient as unknown as Mock).mockImplementation(() => ({
      KubeConfig: null,
    }));

    const caller = createCaller(mockContext);
    await expect(caller.k8s.clusterDetails()).rejects.toThrow();
  });
});
