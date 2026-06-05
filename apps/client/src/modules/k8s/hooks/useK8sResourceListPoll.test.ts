import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { k8sEventConfig } from "@my-project/shared";

const queryMock = vi.fn();
vi.mock("@/core/providers/trpc", () => ({
  useTRPCClient: () => ({ k8s: { list: { query: queryMock } } }),
}));
vi.mock("@/k8s/store", () => ({
  useClusterStore: (sel: (s: { clusterName: string }) => unknown) => sel({ clusterName: "test-cluster" }),
}));

import { useK8sResourceListPoll } from "./useK8sResourceListPoll";

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(
    QueryClientProvider,
    { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
    children
  );

describe("useK8sResourceListPoll", () => {
  beforeEach(() => vi.clearAllMocks());

  it("forwards namespace, limit and fieldSelector and exposes data.array", async () => {
    queryMock.mockResolvedValueOnce({
      apiVersion: "v1",
      kind: "EventList",
      metadata: { resourceVersion: "1" },
      items: [{ metadata: { name: "e1" } }, { metadata: { name: "e2" } }],
    });

    const { result } = renderHook(
      () => useK8sResourceListPoll(k8sEventConfig, "ns", { limit: 50, fieldSelector: "involvedObject.uid=u1" }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.data.array).toHaveLength(2));
    expect(queryMock).toHaveBeenCalledWith({
      clusterName: "test-cluster",
      resourceConfig: k8sEventConfig,
      namespace: "ns",
      limit: 50,
      fieldSelector: "involvedObject.uid=u1",
    });
    expect(result.current.isReady).toBe(true);
  });

  it("keeps an empty-string namespace (cluster-wide) instead of falling back to the stored namespace", async () => {
    queryMock.mockResolvedValueOnce({
      apiVersion: "v1",
      kind: "EventList",
      metadata: { resourceVersion: "1" },
      items: [],
    });

    renderHook(() => useK8sResourceListPoll(k8sEventConfig, "", { limit: 100 }), { wrapper });

    await waitFor(() => expect(queryMock).toHaveBeenCalled());
    expect(queryMock).toHaveBeenCalledWith({
      clusterName: "test-cluster",
      resourceConfig: k8sEventConfig,
      namespace: "",
      limit: 100,
      fieldSelector: undefined,
    });
  });

  it("reports loading (not empty) during the placeholder phase", () => {
    queryMock.mockReturnValueOnce(new Promise(() => {}));
    const { result } = renderHook(() => useK8sResourceListPoll(k8sEventConfig, "ns", { limit: 10 }), {
      wrapper,
    });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isReady).toBe(false);
    expect(result.current.isEmpty).toBe(false);
  });

  it("does not fetch when disabled (enabled: false)", () => {
    const { result } = renderHook(() => useK8sResourceListPoll(k8sEventConfig, "ns", { enabled: false, limit: 10 }), {
      wrapper,
    });
    expect(queryMock).not.toHaveBeenCalled();
    expect(result.current.isReady).toBe(false);
    expect(result.current.data.array).toEqual([]);
  });
});
