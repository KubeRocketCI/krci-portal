import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mutateMock = vi.fn();
vi.mock("@/core/providers/trpc", () => ({
  useTRPCClient: () => ({ k8s: { scaleWorkload: { mutate: mutateMock } } }),
}));
vi.mock("@/core/components/Snackbar", () => ({ showToast: vi.fn().mockReturnValue("id") }));
vi.mock("@/k8s/store", () => ({
  useClusterStore: (sel: (s: { clusterName: string }) => unknown) => sel({ clusterName: "test-cluster" }),
}));

import { useK8sScale } from "./useK8sScale";
import { showToast } from "@/core/components/Snackbar";

const config = {
  group: "apps",
  version: "v1",
  apiVersion: "apps/v1",
  kind: "Deployment",
  singularName: "deployment",
  pluralName: "deployments",
} as const;

function makeWrapper(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useK8sScale", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls scaleWorkload.mutate with the right payload", async () => {
    mutateMock.mockResolvedValueOnce({ spec: { replicas: 5 } });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useK8sScale(config), { wrapper: makeWrapper(queryClient) });

    await act(async () => {
      await result.current.mutateAsync({ namespace: "ns", name: "foo", replicas: 5 });
    });

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalledWith({
        namespace: "ns",
        name: "foo",
        resourceConfig: config,
        replicas: 5,
      });
    });
  });

  it("invalidates only the exact watchItem key for the scaled resource (name-targeted)", async () => {
    mutateMock.mockResolvedValueOnce({ spec: { replicas: 3 } });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useK8sScale(config), { wrapper: makeWrapper(queryClient) });

    await act(async () => {
      await result.current.mutateAsync({ namespace: "ns", name: "my-deploy", replicas: 3 });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["k8s:watchItem", "test-cluster", "ns", "apps", "deployments", "my-deploy"],
      });
      // Must NOT invalidate items for other resources under the same namespace prefix
      expect(invalidateSpy).not.toHaveBeenCalledWith({
        queryKey: ["k8s:watchItem", "test-cluster", "ns", "apps", "deployments"],
      });
    });
  });

  it("fires an error toast with the resource name and underlying error message when the mutation throws", async () => {
    mutateMock.mockRejectedValueOnce(new Error("scale rejected by server"));
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const { result } = renderHook(() => useK8sScale(config), { wrapper: makeWrapper(queryClient) });

    await act(async () => {
      await result.current.mutateAsync({ namespace: "ns", name: "foo", replicas: 5 }).catch(() => {});
    });

    await waitFor(() => {
      expect(vi.mocked(showToast)).toHaveBeenCalledWith(
        "Failed to scale Deployment foo",
        "error",
        expect.objectContaining({ description: "scale rejected by server", duration: 10000 })
      );
    });
  });
});
