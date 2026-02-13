import { createMockedContext } from "../../../../../__mocks__/context.js";
import { createCaller } from "../../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi, Mock } from "vitest";
import { K8sClient } from "../../../../../clients/k8s/index.js";

vi.mock("../../../../../clients/k8s/index.js", () => ({
  K8sClient: vi.fn(),
}));

vi.mock("../../../../../utils/createK8sWatchSubscription/index.js", () => ({
  createK8sWatchSubscription: vi.fn(function* () {
    yield { type: "ADDED", object: { metadata: { name: "item-1" } } };
  }),
}));

describe("k8s.watchList", () => {
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
    const resourceConfig = {
      group: "test.io",
      version: "v1",
      kind: "Test",
      singularName: "test",
      pluralName: "tests",
      apiVersion: "test.io/v1",
    };

    const result = caller.k8s.watchList({
      clusterName: "c",
      namespace: "default",
      resourceConfig,
      resourceVersion: "0",
    });

    await expect(
      (async () => {
        const iterable = typeof result?.then === "function" ? await result : result;
        const asyncIterable = iterable as AsyncIterable<unknown>;
        const iter = asyncIterable[Symbol.asyncIterator]();
        await iter.next();
      })()
    ).rejects.toThrow();
  });
});
