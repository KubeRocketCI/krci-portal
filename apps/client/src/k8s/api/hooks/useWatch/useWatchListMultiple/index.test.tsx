import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import type { K8sResourceConfig, KubeObjectBase } from "@my-project/shared";
import { createTestQueryClient } from "@/test/utils";
import { useWatchListMultiple, UseWatchListMultipleParams } from "./index";
import { codebaseConfig, deferred, listsByNamespace, makeItem, TestList, watchListKey } from "../testUtils";
import { UseWatchListMultipleResult, WatchEvent } from "../types";

type Handler = (event: WatchEvent<KubeObjectBase>) => void;

const { mockListQuery, mockDiscoveryQuery, mockRegistry, handlers } = vi.hoisted(() => {
  const handlers = new Map<string, (event: unknown) => void>();

  return {
    handlers,
    mockListQuery: vi.fn(),
    mockDiscoveryQuery: vi.fn(),
    mockRegistry: {
      register: vi.fn((queryKey: unknown, _params: unknown, handler: (event: unknown) => void) => {
        handlers.set(JSON.stringify(queryKey), handler);
        return vi.fn();
      }),
      startSubscription: vi.fn(),
    },
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
  useWatchRegistries: () => ({ watchListRegistry: mockRegistry }),
}));

const gatewayConfig: K8sResourceConfig = {
  apiVersion: "gateway.networking.k8s.io/v1",
  group: "gateway.networking.k8s.io",
  version: "v1",
  kind: "Gateway",
  singularName: "gateway",
  pluralName: "gateways",
  mayBeAbsent: true,
};

const renderWatchListMultiple = (params: Partial<UseWatchListMultipleParams<KubeObjectBase>> = {}) => {
  const queryClient = createTestQueryClient();
  const renders: UseWatchListMultipleResult<KubeObjectBase>[] = [];
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  const view = renderHook(
    () => {
      const result = useWatchListMultiple<KubeObjectBase>({ resourceConfig: codebaseConfig, ...params });
      renders.push(result);
      return result;
    },
    { wrapper }
  );

  return { ...view, renders, queryClient };
};

const itemNames = (result: UseWatchListMultipleResult<KubeObjectBase>) =>
  result.data.array.map((item) => item.metadata.name).sort();

// Lets the effects flush so a "not called" assertion is not merely early.
const settle = () => act(async () => {});

beforeEach(() => {
  vi.clearAllMocks();
  handlers.clear();
  mockListQuery.mockImplementation(({ namespace }: { namespace?: string }) =>
    Promise.resolve(listsByNamespace[namespace ?? ""])
  );
});

describe("useWatchListMultiple", () => {
  it("never settles loading before the rows of every loaded namespace are in data", async () => {
    const nsA = deferred<TestList>();
    const nsB = deferred<TestList>();
    mockListQuery.mockImplementation(({ namespace }: { namespace?: string }) =>
      namespace === "ns-a" ? nsA.promise : nsB.promise
    );

    const { result, renders } = renderWatchListMultiple();

    await act(async () => nsA.resolve(listsByNamespace["ns-a"]));
    expect(result.current.isLoading).toBe(true);

    await act(async () => nsB.resolve(listsByNamespace["ns-b"]));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const settledRenders = renders.filter((render) => !render.isLoading);
    expect(settledRenders.length).toBeGreaterThan(0);
    settledRenders.forEach((render) => {
      expect(itemNames(render)).toEqual(["app-a", "app-b"]);
    });
    expect(result.current.isReady).toBe(true);
    expect(result.current.isEmpty).toBe(false);
    expect([...result.current.data.map.keys()].sort()).toEqual(["ns-a/app-a", "ns-b/app-b"]);
  });

  it("updates rows when a watch event arrives", async () => {
    const { result } = renderWatchListMultiple();
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await waitFor(() => expect(handlers.has(watchListKey("ns-a"))).toBe(true));

    const modified = { ...makeItem("app-a", "ns-a", "11"), kind: "Modified" } as KubeObjectBase;
    act(() => {
      (handlers.get(watchListKey("ns-a")) as Handler)({ type: "MODIFIED", data: modified });
    });
    await waitFor(() => expect(result.current.data.map.get("ns-a/app-a")).toBe(modified));

    act(() => {
      (handlers.get(watchListKey("ns-b")) as Handler)({ type: "ADDED", data: makeItem("app-c", "ns-b", "21") });
    });
    await waitFor(() => expect(itemNames(result.current)).toEqual(["app-a", "app-b", "app-c"]));

    act(() => {
      (handlers.get(watchListKey("ns-b")) as Handler)({ type: "DELETED", data: makeItem("app-b", "ns-b", "22") });
    });
    await waitFor(() => expect(itemNames(result.current)).toEqual(["app-a", "app-c"]));
  });

  it("keeps the other namespaces when one namespace fails", async () => {
    const forbidden = { message: "forbidden", data: { httpStatus: 403 } };
    mockListQuery.mockImplementation(({ namespace }: { namespace?: string }) =>
      namespace === "ns-b" ? Promise.reject(forbidden) : Promise.resolve(listsByNamespace["ns-a"])
    );

    const { result, renders } = renderWatchListMultiple();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(itemNames(result.current)).toEqual(["app-a"]);
    expect(result.current.errors).toEqual([forbidden]);
    expect(result.current.error).toBe(forbidden);
    expect(result.current.isReady).toBe(false);
    renders
      .filter((render) => !render.isLoading)
      .forEach((render) => {
        expect(itemNames(render)).toEqual(["app-a"]);
      });
  });

  it("keeps data and errors referentially stable across unrelated renders", async () => {
    const { result, rerender } = renderWatchListMultiple();
    await waitFor(() => expect(result.current.isReady).toBe(true));

    const { data, errors } = result.current;
    rerender();

    expect(result.current.data).toBe(data);
    expect(result.current.errors).toBe(errors);
  });

  it("applies the transform at read time and keeps the cache untransformed", async () => {
    const transform = (items: Map<string, KubeObjectBase>) =>
      new Map([...items].map(([key, item]) => [key, { ...item, kind: "Transformed" } as KubeObjectBase]));

    const { result, queryClient } = renderWatchListMultiple({ namespaces: ["ns-a"], transform });

    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.data.array[0].kind).toBe("Transformed");

    const cached = queryClient.getQueryData<{ items: Map<string, KubeObjectBase> }>(JSON.parse(watchListKey("ns-a")));
    expect(cached?.items.get("app-a")?.kind).toBe("Codebase");
  });

  it("settles instead of loading forever when the type is not served", async () => {
    mockDiscoveryQuery.mockResolvedValue({ status: "not-served", plurals: [] });

    const { result } = renderWatchListMultiple({ resourceConfig: gatewayConfig });

    await waitFor(() => expect(result.current.availability).toBe("not-served"));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isReady).toBe(false);
    expect(result.current.data.array).toEqual([]);
    expect(result.current.errors).toEqual([]);
    await settle();
    expect(mockListQuery).not.toHaveBeenCalled();
    expect(mockRegistry.register).not.toHaveBeenCalled();
  });

  it("keeps loading while discovery is pending for a type that may be absent", async () => {
    mockDiscoveryQuery.mockReturnValue(new Promise(() => {}));

    const { result } = renderWatchListMultiple({ resourceConfig: gatewayConfig });

    await settle();
    expect(result.current.availability).toBe("pending");
    expect(result.current.isLoading).toBe(true);
    expect(mockListQuery).not.toHaveBeenCalled();
  });
});
