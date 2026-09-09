import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useWatchList } from "./index";
import { getK8sDiscoveryDocumentQueryCacheKey } from "../query-keys";
import { createTestQueryClient } from "@/test/utils";
import type { K8sResourceConfig, KubeObjectBase } from "@my-project/shared";

const { mockListQuery, mockDiscoveryQuery, mockRegistry } = vi.hoisted(() => ({
  mockListQuery: vi.fn(),
  mockDiscoveryQuery: vi.fn(),
  mockRegistry: {
    register: vi.fn(() => vi.fn()),
    startSubscription: vi.fn(),
  },
}));

vi.mock("@/core/providers/trpc", () => ({
  useTRPCClient: () => ({
    k8s: { list: { query: mockListQuery }, discoveryDocument: { query: mockDiscoveryQuery } },
  }),
}));

vi.mock("@/core/auth/provider", () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

vi.mock("@/k8s/store", () => ({
  useClusterStore: (selector: (state: unknown) => unknown) =>
    selector({ clusterName: "test-cluster", defaultNamespace: "test-ns" }),
}));

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

const podConfig: K8sResourceConfig = {
  apiVersion: "v1",
  group: "",
  version: "v1",
  kind: "Pod",
  singularName: "pod",
  pluralName: "pods",
};

const gateway = {
  apiVersion: "gateway.networking.k8s.io/v1",
  kind: "Gateway",
  metadata: { name: "eg", namespace: "test-ns", resourceVersion: "100" },
} as unknown as KubeObjectBase;

const gatewayList = {
  apiVersion: "gateway.networking.k8s.io/v1",
  kind: "GatewayList",
  metadata: { resourceVersion: "100" },
  items: [gateway],
};

const served = { status: "served" as const, plurals: ["gateways", "httproutes"] };
const notServed = { status: "not-served" as const, plurals: [] as string[] };
const discoveryKey = getK8sDiscoveryDocumentQueryCacheKey("test-cluster", "gateway.networking.k8s.io", "v1");

const renderWatchList = (resourceConfig: K8sResourceConfig = gatewayConfig, queryOptions?: { enabled?: boolean }) => {
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  return {
    ...renderHook(() => useWatchList<KubeObjectBase>({ resourceConfig, queryOptions }), { wrapper }),
    queryClient,
  };
};

// Lets the effects flush so a "not called" assertion is not merely early.
const settle = () => act(async () => {});

beforeEach(() => {
  vi.clearAllMocks();
  mockListQuery.mockResolvedValue(gatewayList);
});

describe("useWatchList capability gate", () => {
  it("runs neither the list nor the subscription when the type is not served", async () => {
    mockDiscoveryQuery.mockResolvedValue(notServed);

    const { result } = renderWatchList();

    await waitFor(() => expect(result.current.availability).toBe("not-served"));
    await settle();
    expect(mockListQuery).not.toHaveBeenCalled();
    expect(mockRegistry.register).not.toHaveBeenCalled();
    expect(mockRegistry.startSubscription).not.toHaveBeenCalled();
  });

  it("settles instead of loading forever when the type is not served", async () => {
    mockDiscoveryQuery.mockResolvedValue(notServed);

    const { result } = renderWatchList();

    await waitFor(() => expect(result.current.availability).toBe("not-served"));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isReady).toBe(false);
    expect(result.current.data.array).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("keeps loading while discovery is still pending", async () => {
    mockDiscoveryQuery.mockReturnValue(new Promise(() => {}));

    const { result } = renderWatchList();

    await settle();
    expect(result.current.availability).toBe("pending");
    expect(result.current.isLoading).toBe(true);
    expect(mockListQuery).not.toHaveBeenCalled();
    expect(mockRegistry.register).not.toHaveBeenCalled();
  });

  it("fails open and lists when discovery could not answer", async () => {
    mockDiscoveryQuery.mockRejectedValue({ data: { httpStatus: 403 } });

    const { result } = renderWatchList();

    await waitFor(() => expect(result.current.availability).toBe("unknown"));
    await waitFor(() => expect(result.current.data.array).toEqual([gateway]));
    expect(mockListQuery).toHaveBeenCalledTimes(1);
  });

  it("lists and watches normally when the type is served", async () => {
    mockDiscoveryQuery.mockResolvedValue(served);

    const { result } = renderWatchList();

    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.availability).toBe("served");
    expect(mockRegistry.register).toHaveBeenCalledTimes(1);
    expect(mockRegistry.startSubscription).toHaveBeenCalledWith(expect.anything(), "100");
  });

  it("reopens once discovery reports the type served", async () => {
    mockDiscoveryQuery.mockResolvedValueOnce(notServed).mockResolvedValueOnce(served);

    const { result, queryClient } = renderWatchList();

    await waitFor(() => expect(result.current.availability).toBe("not-served"));

    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: discoveryKey });
    });

    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(mockRegistry.startSubscription).toHaveBeenCalledTimes(1);
  });

  it("discovers nothing while the caller disables the hook", async () => {
    mockDiscoveryQuery.mockResolvedValue(served);

    const { result } = renderWatchList(gatewayConfig, { enabled: false });

    await settle();
    expect(mockDiscoveryQuery).not.toHaveBeenCalled();
    expect(mockListQuery).not.toHaveBeenCalled();
    expect(mockRegistry.register).not.toHaveBeenCalled();
    expect(result.current.availability).toBe("served");
  });

  it("does not discover a type that cannot be absent", async () => {
    const { result } = renderWatchList(podConfig);

    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(mockDiscoveryQuery).not.toHaveBeenCalled();
    expect(result.current.availability).toBe("served");
  });
});
