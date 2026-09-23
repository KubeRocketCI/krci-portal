import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import type { K8sResourceConfig, KubeObjectBase } from "@my-project/shared";
import { createTestQueryClient } from "@/test/utils";
import { NamespacedListWatch, useNamespacedListWatch, UseNamespacedListWatchParams } from "./index";
import { codebaseConfig, deferred, listsByNamespace, makeItem, makeList, TestList, watchListKey } from "../testUtils";
import { WatchEvent } from "../types";

type Handler = (event: WatchEvent<KubeObjectBase>) => void;
type Params = Partial<UseNamespacedListWatchParams<KubeObjectBase>>;

const { mockListQuery, mockDiscoveryQuery, createMockRegistry, registryState } = vi.hoisted(() => {
  const createMockRegistry = () => {
    const handlers = new Map<string, (event: unknown) => void>();
    const unregisters = new Map<string, ReturnType<typeof vi.fn>>();

    return {
      handlers,
      unregisters,
      register: vi.fn((queryKey: unknown, _params: unknown, handler: (event: unknown) => void) => {
        const id = JSON.stringify(queryKey);
        const unregister = vi.fn();
        handlers.set(id, handler);
        unregisters.set(id, unregister);
        return unregister;
      }),
      startSubscription: vi.fn(),
    };
  };

  return {
    createMockRegistry,
    registryState: { current: createMockRegistry() },
    mockListQuery: vi.fn(),
    mockDiscoveryQuery: vi.fn(),
  };
});

vi.mock("@/core/providers/trpc", () => ({
  useTRPCClient: () => ({
    k8s: { list: { query: mockListQuery }, discoveryDocument: { query: mockDiscoveryQuery } },
  }),
}));

vi.mock("@/core/auth/provider", () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

vi.mock("@/k8s/store", async () => {
  const { testClusterState } = await import("../testUtils");
  return {
    useClusterStore: (selector: (state: unknown) => unknown) => selector(testClusterState),
  };
});

vi.mock("@/core/providers/subscriptions", () => ({
  useWatchRegistries: () => ({ watchListRegistry: registryState.current }),
}));

const clusterScopedConfig: K8sResourceConfig = {
  apiVersion: "triggers.tekton.dev/v1beta1",
  group: "triggers.tekton.dev",
  version: "v1beta1",
  kind: "ClusterInterceptor",
  singularName: "clusterinterceptor",
  pluralName: "clusterinterceptors",
  clusterScoped: true,
};

const renderNamespacedListWatch = (initialParams: Params = {}) => {
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  const view = renderHook(
    (params: Params = initialParams) =>
      useNamespacedListWatch<KubeObjectBase>({ resourceConfig: codebaseConfig, ...params }),
    { wrapper, initialProps: initialParams }
  );

  return { ...view, queryClient };
};

const allSucceeded = (watch: NamespacedListWatch<KubeObjectBase>) =>
  watch.results.every((result) => result.isSuccess && !result.isPlaceholderData);

const itemNames = (watch: NamespacedListWatch<KubeObjectBase>, index: number) =>
  [...(watch.results[index].data?.items.keys() ?? [])].sort();

const listedNamespaces = () => mockListQuery.mock.calls.map(([input]) => input.namespace).sort();

const unregisterOf = (registry: ReturnType<typeof createMockRegistry>, namespace: string) =>
  registry.unregisters.get(watchListKey(namespace))!;

// Lets the effects flush so a "not called" assertion is not merely early.
const settle = () => act(async () => {});

beforeEach(() => {
  vi.clearAllMocks();
  registryState.current = createMockRegistry();
  mockListQuery.mockImplementation(({ namespace }: { namespace?: string }) =>
    Promise.resolve(listsByNamespace[namespace ?? ""])
  );
});

describe("useNamespacedListWatch", () => {
  describe("listing", () => {
    it("falls back to the allowed namespaces and lists each one", async () => {
      const { result } = renderNamespacedListWatch();

      expect(result.current.namespaces).toEqual(["ns-a", "ns-b"]);
      await waitFor(() => expect(allSucceeded(result.current)).toBe(true));
      expect(mockListQuery).toHaveBeenCalledTimes(2);
      expect(listedNamespaces()).toEqual(["ns-a", "ns-b"]);
      expect(itemNames(result.current, 0)).toEqual(["app-a"]);
      expect(itemNames(result.current, 1)).toEqual(["app-b"]);
      expect(result.current.availability).toBe("served");
      expect(result.current.notServed).toBe(false);
    });

    it("lists only the requested namespaces", async () => {
      const { result } = renderNamespacedListWatch({ namespaces: ["ns-b"] });

      expect(result.current.namespaces).toEqual(["ns-b"]);
      await waitFor(() => expect(allSucceeded(result.current)).toBe(true));
      expect(result.current.results).toHaveLength(1);
      expect(itemNames(result.current, 0)).toEqual(["app-b"]);
      expect(mockListQuery).toHaveBeenCalledTimes(1);
      expect(listedNamespaces()).toEqual(["ns-b"]);
    });

    it("queries and watches each namespace once when namespaces repeat", async () => {
      const registry = registryState.current;
      const { result } = renderNamespacedListWatch({ namespaces: ["ns-a", "ns-a", "ns-b"] });

      expect(result.current.namespaces).toEqual(["ns-a", "ns-b"]);
      expect(result.current.results).toHaveLength(2);
      await waitFor(() => expect(registry.register).toHaveBeenCalledTimes(2));
      await settle();

      expect(mockListQuery).toHaveBeenCalledTimes(2);
      expect(listedNamespaces()).toEqual(["ns-a", "ns-b"]);
      expect([...registry.unregisters.keys()].sort()).toEqual([watchListKey("ns-a"), watchListKey("ns-b")].sort());
    });

    it("lists a cluster-scoped type once, cluster-wide", async () => {
      mockListQuery.mockResolvedValue(makeList([makeItem("cel", undefined, "5")], "5"));

      const { result } = renderNamespacedListWatch({ resourceConfig: clusterScopedConfig });

      expect(result.current.namespaces).toEqual([undefined]);
      await waitFor(() => expect(allSucceeded(result.current)).toBe(true));
      expect(mockListQuery).toHaveBeenCalledTimes(1);
      expect(mockListQuery).toHaveBeenCalledWith(expect.objectContaining({ namespace: undefined }));
      expect(itemNames(result.current, 0)).toEqual(["cel"]);
      await waitFor(() =>
        expect(registryState.current.register).toHaveBeenCalledWith(
          JSON.parse(watchListKey(undefined, clusterScopedConfig)),
          expect.objectContaining({ namespace: undefined }),
          expect.any(Function)
        )
      );
    });

    it("neither lists nor watches while the caller disables it", async () => {
      renderNamespacedListWatch({ queryOptions: { enabled: false } });

      await settle();
      expect(mockListQuery).not.toHaveBeenCalled();
      expect(registryState.current.register).not.toHaveBeenCalled();
      expect(registryState.current.startSubscription).not.toHaveBeenCalled();
    });
  });

  describe("watch registration", () => {
    it("registers and starts one watch per namespace without restarting a settled sibling", async () => {
      const registry = registryState.current;
      const nsB = deferred<TestList>();
      mockListQuery.mockImplementation(({ namespace }: { namespace?: string }) =>
        namespace === "ns-a" ? Promise.resolve(listsByNamespace["ns-a"]) : nsB.promise
      );

      const { result } = renderNamespacedListWatch();
      await waitFor(() =>
        expect(registry.startSubscription).toHaveBeenCalledWith(JSON.parse(watchListKey("ns-a")), "10")
      );

      await act(async () => nsB.resolve(listsByNamespace["ns-b"]));
      await waitFor(() => expect(allSucceeded(result.current)).toBe(true));
      await settle();

      expect(registry.register).toHaveBeenCalledTimes(2);
      registry.unregisters.forEach((unregister) => expect(unregister).not.toHaveBeenCalled());
      expect(registry.startSubscription).toHaveBeenCalledWith(JSON.parse(watchListKey("ns-b")), "20");
    });

    it("resumes the subscription from the latest resourceVersion after a watch event", async () => {
      const registry = registryState.current;
      renderNamespacedListWatch({ namespaces: ["ns-a"] });
      await waitFor(() => expect(registry.handlers.has(watchListKey("ns-a"))).toBe(true));

      await act(async () => {
        (registry.handlers.get(watchListKey("ns-a")) as Handler)({
          type: "ADDED",
          data: makeItem("app-x", "ns-a", "15"),
        });
      });

      await waitFor(() =>
        expect(registry.startSubscription).toHaveBeenLastCalledWith(JSON.parse(watchListKey("ns-a")), "15")
      );
      expect(registry.register).toHaveBeenCalledTimes(1);
    });

    it("unregisters every namespace's watch on unmount", async () => {
      const registry = registryState.current;
      const { unmount } = renderNamespacedListWatch();
      await waitFor(() => expect(registry.register).toHaveBeenCalledTimes(2));

      unmount();

      expect(unregisterOf(registry, "ns-a")).toHaveBeenCalledTimes(1);
      expect(unregisterOf(registry, "ns-b")).toHaveBeenCalledTimes(1);
    });

    it("releases the old registry's watches and registers with a new registry", async () => {
      const oldRegistry = registryState.current;
      const { rerender } = renderNamespacedListWatch();
      await waitFor(() => expect(oldRegistry.register).toHaveBeenCalledTimes(2));

      const newRegistry = createMockRegistry();
      registryState.current = newRegistry;
      rerender();

      await waitFor(() => expect(newRegistry.register).toHaveBeenCalledTimes(2));
      expect(unregisterOf(oldRegistry, "ns-a")).toHaveBeenCalledTimes(1);
      expect(unregisterOf(oldRegistry, "ns-b")).toHaveBeenCalledTimes(1);
      expect(newRegistry.startSubscription).toHaveBeenCalledWith(JSON.parse(watchListKey("ns-a")), "10");
      expect(newRegistry.startSubscription).toHaveBeenCalledWith(JSON.parse(watchListKey("ns-b")), "20");
      expect(oldRegistry.register).toHaveBeenCalledTimes(2);
    });

    it("unregisters only a removed namespace and keeps the rest registered", async () => {
      const registry = registryState.current;
      const { result, rerender } = renderNamespacedListWatch({ namespaces: ["ns-a", "ns-b"] });
      await waitFor(() => expect(registry.register).toHaveBeenCalledTimes(2));

      rerender({ namespaces: ["ns-a"] });
      await settle();

      expect(result.current.namespaces).toEqual(["ns-a"]);
      expect(unregisterOf(registry, "ns-b")).toHaveBeenCalledTimes(1);
      expect(unregisterOf(registry, "ns-a")).not.toHaveBeenCalled();
      expect(registry.register).toHaveBeenCalledTimes(2);
    });
  });

  describe("snapshotKey", () => {
    it("changes after a watch event and stays equal across an unrelated rerender", async () => {
      const registry = registryState.current;
      const { result, rerender } = renderNamespacedListWatch({ namespaces: ["ns-a"] });
      await waitFor(() => expect(allSucceeded(result.current)).toBe(true));
      await waitFor(() => expect(registry.handlers.has(watchListKey("ns-a"))).toBe(true));

      const settledKey = result.current.snapshotKey;
      rerender();
      expect(result.current.snapshotKey).toBe(settledKey);

      act(() => {
        (registry.handlers.get(watchListKey("ns-a")) as Handler)({
          type: "ADDED",
          data: makeItem("app-x", "ns-a", "15"),
        });
      });
      await waitFor(() => expect(result.current.snapshotKey).not.toBe(settledKey));

      const updatedKey = result.current.snapshotKey;
      rerender();
      expect(result.current.snapshotKey).toBe(updatedKey);
    });
  });
});
