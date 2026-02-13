import { createMockedContext } from "../../../../../__mocks__/context.js";
import { createCaller } from "../../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi, Mock } from "vitest";
import { K8sClient } from "../../../../../clients/k8s/index.js";

vi.mock("../../../../../clients/k8s/index.js", () => ({
  K8sClient: vi.fn(),
}));

describe("k8s.podLogs", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
    (K8sClient as unknown as Mock).mockImplementation(() => ({
      KubeConfig: {
        getCurrentCluster: () => ({ name: "test", server: "https://kubernetes.default.svc" }),
        getCurrentUser: () => ({}),
        applyToHTTPSOptions: () => {},
        applyToFetchOptions: () => {},
      },
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should throw when KubeConfig is not initialized", async () => {
    (K8sClient as unknown as Mock).mockImplementation(() => ({
      KubeConfig: null,
    }));

    const caller = createCaller(mockContext);
    await expect(
      caller.k8s.podLogs({
        clusterName: "c",
        namespace: "default",
        podName: "my-pod",
      })
    ).rejects.toThrow();
  });
});
