import { describe, it, beforeEach, afterEach, expect, vi, Mock } from "vitest";
import { Watch } from "@kubernetes/client-node";
import { createCaller } from "@/trpc/routers";
import { createMockedContext } from "@/__mocks__/context";

vi.mock("@kubernetes/client-node", async () => {
  const actual = await vi.importActual<
    typeof import("@kubernetes/client-node")
  >("@kubernetes/client-node");

  return {
    ...actual,
    Watch: vi.fn().mockImplementation(() => ({
      watch: vi.fn(),
    })),
    KubeConfig: vi.fn().mockImplementation(() => ({
      loadFromDefault: vi.fn(),
    })),
  };
});

const input = {
  clusterName: "test-cluster",
  group: "test.group.io",
  version: "v1",
  namespace: "default",
  resourcePlural: "tests",
  resourceVersion: "123",
};

describe("k8sWatchListProcedure", () => {
  let watchMock: Mock;
  let abortMock: Mock;
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    abortMock = vi.fn();
    watchMock = vi.fn().mockResolvedValue({
      abort: abortMock,
    });

    (Watch as unknown as Mock).mockImplementation(() => ({
      watch: watchMock,
    }));

    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should emit data on resource update and abort on unsubscribe", async () => {
    const caller = createCaller(mockContext);

    let nextCallback: (value: unknown) => void = () => {};
    const errorCallback: (err: Error | null) => void = () => {};

    // Call the procedure and subscribe
    const observable = await caller.k8s.watchList(input);
    const unsubscribeable = observable.subscribe({
      next: (value) => nextCallback(value),
      error: (err) => errorCallback(err),
    });

    // Simulate K8s watch emit
    const fakeObj = { metadata: { name: "test-name" } };
    const type = "MODIFIED";
    const emit = watchMock.mock.calls[0][2];

    const resultPromise = new Promise((resolve) => {
      nextCallback = resolve;
    });

    emit(type, fakeObj);
    const result = await resultPromise;

    expect(result).toEqual({ type, data: fakeObj });

    unsubscribeable.unsubscribe();
    expect(abortMock).toHaveBeenCalled();
  });

  it("should emit error on watch failure", async () => {
    const caller = createCaller(mockContext);

    const observable = await caller.k8s.watchList(input);

    const errorPromise = new Promise((resolve) => {
      observable.subscribe({
        next: () => {},
        error: (err) => resolve(err),
      });

      const errorCb = watchMock.mock.calls[0][3];
      errorCb(new Error("Watch failed"));
    });

    const receivedError = await errorPromise;
    expect(receivedError).toBeInstanceOf(Error);
    expect((receivedError as Error).message).toBe("Watch failed");
  });
});
