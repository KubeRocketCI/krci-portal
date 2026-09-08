import { describe, expect, it, vi } from "vitest";
import { WatchItemRegistry } from "./registry";
import { MSG_TYPE } from "@/k8s/api/hooks/useWatch/types";
import type { KubeObjectBase } from "@my-project/shared";

const queryKey = ["k8s", "item", "secrets", "ci-sonarqube"];

const params = {
  clusterName: "test-cluster",
  namespace: "test-ns",
  resourceConfig: { pluralName: "secrets" },
  name: "ci-sonarqube",
} as unknown as Parameters<WatchItemRegistry["register"]>[1];

const secret = {
  apiVersion: "v1",
  kind: "Secret",
  metadata: { name: "ci-sonarqube", uid: "uid-1", resourceVersion: "100" },
} as unknown as KubeObjectBase;

const setupRegistry = () => {
  const registry = new WatchItemRegistry();
  const unsubscribe = vi.fn();
  let emit: ((value: { type: string; data?: KubeObjectBase }) => void) | undefined;

  const subscribe = vi.fn((_input: unknown, handlers: { onData: (value: unknown) => void }) => {
    emit = handlers.onData as typeof emit;
    return { unsubscribe };
  });

  registry.setTRPCClient({ k8s: { watchItem: { subscribe } } } as never);

  return {
    registry,
    subscribe,
    unsubscribe,
    emit: (value: { type: string; data?: KubeObjectBase }) => emit!(value),
  };
};

describe("WatchItemRegistry", () => {
  it.each([MSG_TYPE.ADDED, MSG_TYPE.MODIFIED, MSG_TYPE.DELETED])(
    "forwards the %s event type, not only the object",
    (type) => {
      const { registry, emit } = setupRegistry();
      const handler = vi.fn();

      registry.register(queryKey, params, handler);
      registry.startSubscription(queryKey, "100");
      emit({ type, data: secret });

      expect(handler).toHaveBeenCalledWith({ type, data: secret });
    }
  );

  it("drops an event whose object has no name", () => {
    const { registry, emit } = setupRegistry();
    const handler = vi.fn();

    registry.register(queryKey, params, handler);
    registry.startSubscription(queryKey, "100");
    emit({ type: MSG_TYPE.ADDED, data: { metadata: {} } as unknown as KubeObjectBase });

    expect(handler).not.toHaveBeenCalled();
  });

  it("passes the given resourceVersion to the subscription", () => {
    const { registry, subscribe } = setupRegistry();

    registry.register(queryKey, params, vi.fn());
    registry.startSubscription(queryKey, "");

    expect(subscribe).toHaveBeenCalledWith(expect.objectContaining({ resourceVersion: "" }), expect.anything());
  });

  it("reuses a running subscription instead of restarting it", () => {
    const { registry, subscribe } = setupRegistry();

    registry.register(queryKey, params, vi.fn());
    registry.startSubscription(queryKey, "100");
    registry.startSubscription(queryKey, "101");

    expect(subscribe).toHaveBeenCalledTimes(1);
  });

  it("stops the subscription once the last handler unregisters", () => {
    const { registry, unsubscribe } = setupRegistry();
    const handler = vi.fn();

    const unregister = registry.register(queryKey, params, handler);
    registry.startSubscription(queryKey, "100");
    unregister();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
