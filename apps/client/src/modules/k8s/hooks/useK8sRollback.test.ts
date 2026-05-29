import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mutateMock = vi.fn();
vi.mock("@/core/providers/trpc", () => ({
  useTRPCClient: () => ({ k8s: { rollbackDeployment: { mutate: mutateMock } } }),
}));
vi.mock("@/core/components/Snackbar", () => ({ showToast: vi.fn().mockReturnValue("id") }));
vi.mock("@/k8s/store", () => ({
  useClusterStore: (sel: (s: { clusterName: string }) => unknown) => sel({ clusterName: "test-cluster" }),
}));

import { useK8sRollback } from "./useK8sRollback";
import * as Snackbar from "@/core/components/Snackbar";

function makeWrapper(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useK8sRollback", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls rollbackDeployment.mutate with replicaSetUid", async () => {
    mutateMock.mockResolvedValueOnce({});
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useK8sRollback(), { wrapper: makeWrapper(queryClient) });

    await act(async () => {
      await result.current.mutateAsync({ namespace: "ns", name: "foo", replicaSetUid: "rs-1" });
    });

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalledWith({
        namespace: "ns",
        name: "foo",
        replicaSetUid: "rs-1",
      });
    });
  });

  it("invalidates the revision-dialog query under the k8s: namespace prefix", async () => {
    // Regression guard: useDeploymentRevisions registers under "k8s:deploymentRevisions".
    // A previous unprefixed "deploymentRevisions" key silently bypassed cache invalidation
    // so the revision list would not refresh after a successful rollback.
    mutateMock.mockResolvedValueOnce({});
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useK8sRollback(), { wrapper: makeWrapper(queryClient) });

    await act(async () => {
      await result.current.mutateAsync({ namespace: "ns", name: "foo", replicaSetUid: "rs-1" });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["k8s:deploymentRevisions", "test-cluster", "ns", "foo"],
      });
      expect(invalidateSpy).not.toHaveBeenCalledWith({
        queryKey: ["deploymentRevisions", "test-cluster", "ns", "foo"],
      });
    });
  });

  it("fires an error toast with the resource name and underlying error message when the mutation throws", async () => {
    mutateMock.mockRejectedValueOnce(new Error("rollback rejected by server"));
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const { result } = renderHook(() => useK8sRollback(), { wrapper: makeWrapper(queryClient) });

    await act(async () => {
      await result.current.mutateAsync({ namespace: "ns", name: "foo", replicaSetUid: "rs-1" }).catch(() => {});
    });

    await waitFor(() => {
      expect(vi.mocked(Snackbar.showToast)).toHaveBeenCalledWith(
        "Failed to roll back Deployment foo",
        "error",
        expect.objectContaining({ description: "rollback rejected by server", duration: 10000 })
      );
    });
  });
});
