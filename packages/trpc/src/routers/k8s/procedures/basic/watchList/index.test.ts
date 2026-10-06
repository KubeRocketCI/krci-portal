import { createMockedContext } from "../../../../../__mocks__/context.js";
import { createCaller } from "../../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi, Mock } from "vitest";
import { K8sClient } from "../../../../../clients/k8s/index.js";
import { createK8sWatchSubscription, WatchEvent } from "../../../utils/createK8sWatchSubscription/index.js";
import { createCustomResourceURL } from "../../../utils/createCustomResourceURL/index.js";

vi.mock("../../../../../clients/k8s/index.js", () => ({
  K8sClient: vi.fn(),
}));

vi.mock("@kubernetes/client-node", () => ({
  Watch: vi.fn(function () {
    return {};
  }),
}));

vi.mock("../../../utils/createK8sWatchSubscription/index.js", () => ({
  createK8sWatchSubscription: vi.fn(),
}));

vi.mock("../../../utils/createCustomResourceURL/index.js", () => ({
  createCustomResourceURL: vi.fn(() => "/apis/test.io/v1/namespaces/default/tests"),
}));

const resourceConfig = {
  group: "test.io",
  version: "v1",
  kind: "Test",
  singularName: "test",
  pluralName: "tests",
  apiVersion: "test.io/v1",
};

function makeEvent(name: string): WatchEvent {
  return { type: "ADDED", data: { apiVersion: "test.io/v1", kind: "Test", metadata: { name } } as WatchEvent["data"] };
}

async function* eventsFor(names: string[]): AsyncGenerator<WatchEvent, void, unknown> {
  for (const name of names) {
    yield makeEvent(name);
  }
}

async function collect(subscription: unknown): Promise<WatchEvent[]> {
  const iterable = (await subscription) as AsyncIterable<WatchEvent>;
  const result: WatchEvent[] = [];
  for await (const event of iterable) {
    result.push(event);
  }
  return result;
}

describe("k8s.watchList", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
    (K8sClient as unknown as Mock).mockImplementation(function () {
      return { KubeConfig: {} };
    });
    (createK8sWatchSubscription as unknown as Mock).mockImplementation(() => eventsFor(["item-1", "item-2", "item-3"]));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should throw when KubeConfig is not initialized", async () => {
    (K8sClient as unknown as Mock).mockImplementation(function () {
      return { KubeConfig: null };
    });

    const caller = createCaller(mockContext);
    const result = caller.k8s.watchList({
      clusterName: "c",
      namespace: "default",
      resourceConfig,
      resourceVersion: "0",
    });

    await expect(collect(result)).rejects.toThrow();
  });

  it("yields only named objects when names is given", async () => {
    const caller = createCaller(mockContext);
    const result = await collect(
      caller.k8s.watchList({
        clusterName: "c",
        namespace: "default",
        resourceConfig,
        resourceVersion: "0",
        names: ["item-3", "item-1"],
      })
    );

    expect(result.map((event) => event.data.metadata.name)).toEqual(["item-1", "item-3"]);
  });

  it("passes resourceVersion and labels unchanged to createK8sWatchSubscription / createCustomResourceURL", async () => {
    const labels = { "app.edp.epam.com/codebase": "my-app" };
    const caller = createCaller(mockContext);

    await collect(
      caller.k8s.watchList({
        clusterName: "c",
        namespace: "default",
        resourceConfig,
        resourceVersion: "777",
        labels,
        names: ["item-1"],
      })
    );

    expect(createCustomResourceURL).toHaveBeenCalledWith({ resourceConfig, namespace: "default", labels });
    expect(createK8sWatchSubscription).toHaveBeenCalledTimes(1);
    const [, options] = (createK8sWatchSubscription as unknown as Mock).mock.calls[0];
    expect(options.watchUrl).toBe("/apis/test.io/v1/namespaces/default/tests");
    expect(options.watchOptions).toEqual({ resourceVersion: "777" });
  });

  it("yields all events when names is omitted", async () => {
    const caller = createCaller(mockContext);
    const result = await collect(
      caller.k8s.watchList({
        clusterName: "c",
        namespace: "default",
        resourceConfig,
        resourceVersion: "0",
      })
    );

    expect(result.map((event) => event.data.metadata.name)).toEqual(["item-1", "item-2", "item-3"]);
  });

  it("rejects an empty names array", async () => {
    const caller = createCaller(mockContext);

    await expect(
      collect(
        caller.k8s.watchList({
          clusterName: "c",
          namespace: "default",
          resourceConfig,
          resourceVersion: "0",
          names: [],
        })
      )
    ).rejects.toThrow();
    expect(createK8sWatchSubscription).not.toHaveBeenCalled();
  });
});
