import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useWatchItem } from "./index";
import { MSG_TYPE, WatchEvent } from "../types";
import {
  getK8sDiscoveryDocumentQueryCacheKey,
  getK8sWatchItemQueryCacheKey,
  getK8sWatchListQueryCacheKey,
} from "../query-keys";
import { isK8sNotFoundError } from "@/k8s/api/utils/k8sNotFoundError";
import { refetchOnWindowFocusIfStale } from "../utils";
import { createTestQueryClient } from "@/test/utils";
import type { K8sResourceConfig, KubeObjectBase } from "@my-project/shared";
import type { RequestError } from "@/core/types/global";

const { mockGetQuery, mockDiscoveryQuery, mockRegistry, watchHandlers } = vi.hoisted(() => ({
  mockGetQuery: vi.fn(),
  mockDiscoveryQuery: vi.fn(),
  mockRegistry: {
    register: vi.fn(),
    startSubscription: vi.fn(),
  },
  watchHandlers: [] as ((event: WatchEvent<KubeObjectBase>) => void)[],
}));

vi.mock("@/core/providers/trpc", () => ({
  useTRPCClient: () => ({
    k8s: { get: { query: mockGetQuery }, discoveryDocument: { query: mockDiscoveryQuery } },
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
  useWatchRegistries: () => ({ watchItemRegistry: mockRegistry }),
}));

const resourceConfig = {
  group: "",
  version: "v1",
  pluralName: "secrets",
} as unknown as K8sResourceConfig;

const secret = {
  apiVersion: "v1",
  kind: "Secret",
  metadata: { name: "ci-sonarqube", uid: "uid-1", resourceVersion: "100" },
} as unknown as KubeObjectBase;

const notFound = { data: { httpStatus: 404 } };

const itemQueryKey = getK8sWatchItemQueryCacheKey("test-cluster", "test-ns", "", "secrets", "ci-sonarqube");

const renderWatchItem = () => {
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  return {
    ...renderHook(() => useWatchItem<KubeObjectBase>({ resourceConfig, name: "ci-sonarqube" }), { wrapper }),
    queryClient,
  };
};

const emit = (event: WatchEvent<KubeObjectBase>) => act(() => watchHandlers.forEach((handler) => handler(event)));

beforeEach(() => {
  vi.clearAllMocks();
  watchHandlers.length = 0;
  mockRegistry.register.mockImplementation(
    (_queryKey: unknown, _params: unknown, handler: (event: WatchEvent<KubeObjectBase>) => void) => {
      watchHandlers.push(handler);
      return () => {
        watchHandlers.splice(watchHandlers.indexOf(handler), 1);
      };
    }
  );
});

describe("useWatchItem", () => {
  it("watches an object that does not exist yet and shows it once created", async () => {
    mockGetQuery.mockRejectedValue(notFound);

    const { result } = renderWatchItem();

    await waitFor(() => expect(mockRegistry.startSubscription).toHaveBeenCalled());
    expect(mockRegistry.startSubscription).toHaveBeenCalledWith(expect.anything(), "");
    expect(result.current.data).toBeUndefined();

    emit({ type: MSG_TYPE.ADDED, data: secret });

    await waitFor(() => expect(result.current.data).toEqual(secret));
  });

  it("does not watch while the query is failing for another reason", async () => {
    mockGetQuery.mockRejectedValue({ data: { httpStatus: 403 } });

    const { result } = renderWatchItem();

    await waitFor(() => expect(result.current.query.isError).toBe(true));
    expect(mockRegistry.register).not.toHaveBeenCalled();
    expect(mockRegistry.startSubscription).not.toHaveBeenCalled();
  });

  it("clears the item when the watch reports it deleted", async () => {
    mockGetQuery.mockResolvedValue(secret);

    const { result } = renderWatchItem();

    await waitFor(() => expect(result.current.data).toEqual(secret));

    emit({ type: MSG_TYPE.DELETED, data: secret });

    await waitFor(() => expect(result.current.data).toBeUndefined());
    expect(result.current.resourceVersion).toBeUndefined();
    expect(result.current.query.data).toBeUndefined();
  });

  it("never reports ready without an object", async () => {
    mockGetQuery.mockResolvedValue(secret);

    const { result } = renderWatchItem();

    await waitFor(() => expect(result.current.isReady).toBe(true));

    emit({ type: MSG_TYPE.DELETED, data: secret });

    await waitFor(() => expect(result.current.data).toBeUndefined());
    expect(result.current.isReady).toBe(false);
  });

  it("settles a delete on the same 404 a missing name reaches, with no gap", async () => {
    mockGetQuery.mockResolvedValue(secret);

    const { result, queryClient } = renderWatchItem();

    await waitFor(() => expect(result.current.data).toEqual(secret));

    emit({ type: MSG_TYPE.DELETED, data: secret });

    // Detail pages gate on the raw query, so the object and the error must move in one
    // step. Read the cache, not the render, or the two are indistinguishable.
    const state = queryClient.getQueryState<KubeObjectBase | undefined, RequestError>(itemQueryKey);
    expect(state?.data).toBeUndefined();
    expect(isK8sNotFoundError(state?.error ?? null)).toBe(true);
    // No refetch: it would race a re-create of the same name.
    expect(mockGetQuery).toHaveBeenCalledTimes(1);

    await waitFor(() => expect(result.current.isReady).toBe(false));
    expect(result.current.query.isLoading).toBe(false);
  });

  it("does not let a GET in flight during the delete restore the object", async () => {
    let resolveGet: (value: KubeObjectBase) => void = () => {};
    mockGetQuery
      .mockImplementationOnce(() => Promise.resolve(secret))
      .mockImplementationOnce(() => new Promise<KubeObjectBase>((resolve) => (resolveGet = resolve)));

    const { result, queryClient } = renderWatchItem();

    await waitFor(() => expect(result.current.data).toEqual(secret));

    await act(async () => {
      queryClient.refetchQueries({ queryKey: itemQueryKey, exact: true });
    });
    emit({ type: MSG_TYPE.DELETED, data: secret });

    await act(async () => {
      resolveGet(secret);
    });

    const state = queryClient.getQueryState<KubeObjectBase | undefined, RequestError>(itemQueryKey);
    expect(state?.data).toBeUndefined();
    expect(isK8sNotFoundError(state?.error ?? null)).toBe(true);
  });

  it("opens no watch while the caller disables the hook", async () => {
    mockGetQuery.mockRejectedValue(notFound);

    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    // Seed a settled 404 first. A settled query alone must not open the watch while the
    // caller passes `enabled: false`.
    const { unmount } = renderHook(() => useWatchItem<KubeObjectBase>({ resourceConfig, name: "ci-sonarqube" }), {
      wrapper,
    });
    await waitFor(() => expect(mockRegistry.register).toHaveBeenCalledTimes(1));
    unmount();
    vi.clearAllMocks();

    renderHook(
      () => useWatchItem<KubeObjectBase>({ resourceConfig, name: "ci-sonarqube", queryOptions: { enabled: false } }),
      { wrapper }
    );

    await waitFor(() => expect(mockGetQuery).not.toHaveBeenCalled());
    expect(mockRegistry.register).not.toHaveBeenCalled();
    expect(mockRegistry.startSubscription).not.toHaveBeenCalled();
  });

  it("leaves the focus refetch armed after a delete", async () => {
    mockGetQuery.mockResolvedValue(secret);

    const { result, queryClient } = renderWatchItem();

    await waitFor(() => expect(result.current.data).toEqual(secret));

    emit({ type: MSG_TYPE.DELETED, data: secret });

    const state = queryClient.getQueryState(itemQueryKey);
    expect(refetchOnWindowFocusIfStale({ state: { dataUpdatedAt: state!.dataUpdatedAt } })).toBe(true);
  });

  it("recovers when the same name is created again", async () => {
    mockGetQuery.mockResolvedValue(secret);

    const { result } = renderWatchItem();

    await waitFor(() => expect(result.current.data).toEqual(secret));

    emit({ type: MSG_TYPE.DELETED, data: secret });
    emit({ type: MSG_TYPE.ADDED, data: secret });

    await waitFor(() => expect(result.current.data).toEqual(secret));
    expect(result.current.query.error).toBeNull();
    expect(result.current.isReady).toBe(true);
  });

  it("drops the deleted object from the list cache that seeds the item", async () => {
    mockGetQuery.mockResolvedValue(secret);

    const queryClient = createTestQueryClient();
    const listQueryKey = getK8sWatchListQueryCacheKey("test-cluster", "test-ns", "", "secrets");
    queryClient.setQueryData(listQueryKey, {
      apiVersion: "v1",
      kind: "SecretList",
      metadata: { resourceVersion: "100" },
      items: new Map([["ci-sonarqube", secret]]),
    });

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useWatchItem<KubeObjectBase>({ resourceConfig, name: "ci-sonarqube" }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.data).toEqual(secret));

    emit({ type: MSG_TYPE.DELETED, data: secret });

    await waitFor(() => expect(result.current.data).toBeUndefined());
    const listData = queryClient.getQueryData<{ items: Map<string, KubeObjectBase> }>(listQueryKey);
    expect(listData?.items.has("ci-sonarqube")).toBe(false);
  });

  it("keeps a single registration across updates", async () => {
    mockGetQuery.mockResolvedValue(secret);

    const { result } = renderWatchItem();

    await waitFor(() => expect(result.current.data).toEqual(secret));
    expect(mockRegistry.register).toHaveBeenCalledTimes(1);

    emit({
      type: MSG_TYPE.MODIFIED,
      data: { ...secret, metadata: { ...secret.metadata, resourceVersion: "101" } } as KubeObjectBase,
    });

    await waitFor(() => expect(result.current.resourceVersion).toBe("101"));
    expect(mockRegistry.register).toHaveBeenCalledTimes(1);
  });

  it("applies the transform to watch events", async () => {
    mockGetQuery.mockResolvedValue(secret);

    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(
      () =>
        useWatchItem<KubeObjectBase>({
          resourceConfig,
          name: "ci-sonarqube",
          transform: (item) => ({ ...item, kind: "Transformed" }),
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.data?.kind).toBe("Transformed"));

    emit({ type: MSG_TYPE.MODIFIED, data: secret });

    await waitFor(() => expect(result.current.data?.kind).toBe("Transformed"));
  });
});

const tenantConfig: K8sResourceConfig = {
  apiVersion: "capsule.clastix.io/v1beta2",
  group: "capsule.clastix.io",
  version: "v1beta2",
  kind: "Tenant",
  singularName: "tenant",
  pluralName: "tenants",
  clusterScoped: true,
  mayBeAbsent: true,
};

const tenant = {
  apiVersion: "capsule.clastix.io/v1beta2",
  kind: "Tenant",
  metadata: { name: "edp-workload-test-ns", resourceVersion: "100" },
} as unknown as KubeObjectBase;

const served = { status: "served" as const, plurals: ["tenants", "capsuleconfigurations"] };
const notServed = { status: "not-served" as const, plurals: [] as string[] };
const discoveryKey = getK8sDiscoveryDocumentQueryCacheKey("test-cluster", "capsule.clastix.io", "v1beta2");

const tenantName = "edp-workload-test-ns";

const renderGatedItem = (name: string | undefined, queryOptions?: { enabled?: boolean }) => {
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  return {
    ...renderHook(() => useWatchItem<KubeObjectBase>({ resourceConfig: tenantConfig, name, queryOptions }), {
      wrapper,
    }),
    queryClient,
  };
};

// Lets the effects flush so a "not called" assertion is not merely early.
const settle = () => act(async () => {});

describe("useWatchItem capability gate", () => {
  beforeEach(() => {
    mockGetQuery.mockResolvedValue(tenant);
  });

  it("runs neither the GET nor the subscription when the type is not served", async () => {
    mockDiscoveryQuery.mockResolvedValue(notServed);

    const { result } = renderGatedItem(tenantName);

    await waitFor(() => expect(result.current.availability).toBe("not-served"));
    await settle();
    expect(mockGetQuery).not.toHaveBeenCalled();
    expect(mockRegistry.register).not.toHaveBeenCalled();
    expect(mockRegistry.startSubscription).not.toHaveBeenCalled();
  });

  it("settles instead of loading forever when the type is not served", async () => {
    mockDiscoveryQuery.mockResolvedValue(notServed);

    const { result } = renderGatedItem(tenantName);

    await waitFor(() => expect(result.current.availability).toBe("not-served"));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isReady).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.query.error).toBeNull();
  });

  it("keeps loading while discovery is still pending", async () => {
    mockDiscoveryQuery.mockReturnValue(new Promise(() => {}));

    const { result } = renderGatedItem(tenantName);

    await settle();
    expect(result.current.availability).toBe("pending");
    expect(result.current.isLoading).toBe(true);
    expect(mockGetQuery).not.toHaveBeenCalled();
  });

  it("fails open and fetches when discovery could not answer", async () => {
    mockDiscoveryQuery.mockRejectedValue({ data: { httpStatus: 403 } });

    const { result } = renderGatedItem(tenantName);

    await waitFor(() => expect(result.current.availability).toBe("unknown"));
    await waitFor(() => expect(result.current.data).toEqual(tenant));
  });

  it("fetches and watches normally when the type is served", async () => {
    mockDiscoveryQuery.mockResolvedValue(served);

    const { result } = renderGatedItem(tenantName);

    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.availability).toBe("served");
    await waitFor(() => expect(mockRegistry.startSubscription).toHaveBeenCalledWith(expect.anything(), "100"));
  });

  it("reopens once discovery reports the type served", async () => {
    mockDiscoveryQuery.mockResolvedValueOnce(notServed).mockResolvedValueOnce(served);

    const { result, queryClient } = renderGatedItem(tenantName);

    await waitFor(() => expect(result.current.availability).toBe("not-served"));

    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: discoveryKey });
    });

    await waitFor(() => expect(result.current.isReady).toBe(true));
    await waitFor(() => expect(mockRegistry.startSubscription).toHaveBeenCalledTimes(1));
  });

  it("discovers nothing while the caller disables the hook", async () => {
    mockDiscoveryQuery.mockResolvedValue(served);

    const { result } = renderGatedItem(tenantName, { enabled: false });

    await settle();
    expect(mockDiscoveryQuery).not.toHaveBeenCalled();
    expect(mockGetQuery).not.toHaveBeenCalled();
    expect(result.current.availability).toBe("served");
  });

  it("discovers nothing without a name", async () => {
    mockDiscoveryQuery.mockResolvedValue(served);

    renderGatedItem(undefined);

    await settle();
    expect(mockDiscoveryQuery).not.toHaveBeenCalled();
    expect(mockGetQuery).not.toHaveBeenCalled();
  });
});
