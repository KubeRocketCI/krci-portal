import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const queryMock = vi.fn();
vi.mock("@/core/providers/trpc", () => ({
  useTRPCClient: () => ({ k8s: { listDeploymentRevisions: { query: queryMock } } }),
}));
vi.mock("@/k8s/store", () => ({
  useClusterStore: (sel: (s: { clusterName: string }) => unknown) => sel({ clusterName: "test-cluster" }),
}));

import { useDeploymentRevisions } from "./useDeploymentRevisions";

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(
    QueryClientProvider,
    { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
    children
  );

describe("useDeploymentRevisions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls listDeploymentRevisions.query with the right input", async () => {
    queryMock.mockResolvedValueOnce([{ revision: 1 }]);
    const { result } = renderHook(() => useDeploymentRevisions({ namespace: "ns", name: "foo" }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.data).toEqual([{ revision: 1 }]));
    expect(queryMock).toHaveBeenCalledWith({ namespace: "ns", name: "foo" });
  });

  it("is disabled when name is empty", () => {
    const { result } = renderHook(() => useDeploymentRevisions({ namespace: "ns", name: "" }), {
      wrapper,
    });
    expect(queryMock).not.toHaveBeenCalled();
    expect(result.current.isPending).toBe(true);
  });

  it("is disabled when namespace is empty", () => {
    const { result } = renderHook(() => useDeploymentRevisions({ namespace: "", name: "foo" }), {
      wrapper,
    });
    expect(queryMock).not.toHaveBeenCalled();
    expect(result.current.isPending).toBe(true);
  });

  it("is disabled when both name and namespace are empty", () => {
    const { result } = renderHook(() => useDeploymentRevisions({ namespace: "", name: "" }), {
      wrapper,
    });
    expect(queryMock).not.toHaveBeenCalled();
    expect(result.current.isPending).toBe(true);
  });
});
