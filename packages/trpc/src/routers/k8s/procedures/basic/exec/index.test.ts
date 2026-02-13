import { createMockedContext } from "../../../../../__mocks__/context.js";
import { createCaller } from "../../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi, Mock } from "vitest";
import { K8sClient } from "../../../../../clients/k8s/index.js";

vi.mock("../../../../../clients/k8s/index.js", () => ({
  K8sClient: vi.fn(),
}));

describe("k8s.podExec", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
    (K8sClient as unknown as Mock).mockImplementation(() => ({
      KubeConfig: {},
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
      caller.k8s.podExec({
        clusterName: "c",
        namespace: "default",
        podName: "my-pod",
      } as any)
    ).rejects.toThrow();
  });
});
