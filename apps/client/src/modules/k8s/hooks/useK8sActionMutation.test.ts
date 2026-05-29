import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useK8sActionMutation } from "./useK8sActionMutation";

vi.mock("@/core/components/Snackbar", () => ({
  showToast: vi.fn().mockReturnValue("toast-id"),
}));

import { showToast } from "@/core/components/Snackbar";

function makeWrapper(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useK8sActionMutation", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  it("shows loading -> success toast and invalidates ONLY the provided query keys on success", async () => {
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(
      () =>
        useK8sActionMutation<{ name: string }, { ok: true }>({
          mutationKey: "test",
          mutationFn: async () => ({ ok: true }),
          messages: {
            loading: ({ name }) => `Doing ${name}…`,
            success: ({ name }) => `${name} done`,
            error: ({ name }, err) => `${name} failed: ${err.message}`,
          },
          invalidationKeys: ({ name }) => [
            ["k8s:watchList", "cluster", "ns", "deployments"],
            ["k8s:watchItem", "cluster", "ns", "deployments", name],
          ],
        }),
      { wrapper: makeWrapper(queryClient) }
    );

    await act(async () => {
      await result.current.mutateAsync({ name: "foo" });
    });

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith("Doing foo…", "loading");
      expect(showToast).toHaveBeenCalledWith("foo done", "success", expect.objectContaining({ id: "toast-id" }));
      expect(invalidateSpy).toHaveBeenCalledTimes(2);
      expect(invalidateSpy).toHaveBeenNthCalledWith(1, {
        queryKey: ["k8s:watchList", "cluster", "ns", "deployments"],
      });
      expect(invalidateSpy).toHaveBeenNthCalledWith(2, {
        queryKey: ["k8s:watchItem", "cluster", "ns", "deployments", "foo"],
      });
    });
  });

  it("does NOT invalidate any queries when the mutation fails", async () => {
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(
      () =>
        useK8sActionMutation<{ name: string }, never>({
          mutationKey: "test",
          mutationFn: async () => {
            throw new Error("boom");
          },
          messages: {
            loading: ({ name }) => `Doing ${name}…`,
            success: () => "ok",
            error: ({ name }) => `${name} failed`,
          },
          invalidationKeys: () => [["k8s:watchList", "cluster"]],
        }),
      { wrapper: makeWrapper(queryClient) }
    );

    await act(async () => {
      await result.current.mutateAsync({ name: "foo" }).catch(() => {});
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it("does NOT fire the error toast when query invalidation rejects after a successful mutation", async () => {
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries").mockRejectedValueOnce(new Error("cache error"));

    const { result } = renderHook(
      () =>
        useK8sActionMutation<{ name: string }, { ok: true }>({
          mutationKey: "test",
          mutationFn: async () => ({ ok: true }),
          messages: {
            loading: ({ name }) => `Doing ${name}…`,
            success: ({ name }) => `${name} done`,
            error: ({ name }) => `${name} failed`,
          },
          invalidationKeys: () => [["k8s:watchList", "cluster", "ns", "deployments"]],
        }),
      { wrapper: makeWrapper(queryClient) }
    );

    // Mutation should resolve successfully despite invalidation throwing
    await act(async () => {
      await result.current.mutateAsync({ name: "foo" });
    });

    await waitFor(() => {
      // Success toast must appear
      expect(showToast).toHaveBeenCalledWith("foo done", "success", expect.anything());
      // Error toast must NOT appear
      const calls = (showToast as ReturnType<typeof vi.fn>).mock.calls;
      const errorCalls = calls.filter(([, type]) => type === "error");
      expect(errorCalls).toHaveLength(0);
      // Invalidation was attempted
      expect(invalidateSpy).toHaveBeenCalledTimes(1);
    });
  });

  it("shows loading -> error toast with err.message in description on failure", async () => {
    const { result } = renderHook(
      () =>
        useK8sActionMutation<{ name: string }, never>({
          mutationKey: "test",
          mutationFn: async () => {
            throw new Error("boom");
          },
          messages: {
            loading: ({ name }) => `Doing ${name}…`,
            success: () => "ok",
            error: ({ name }) => `${name} failed`,
          },
          invalidationKeys: () => [],
        }),
      { wrapper: makeWrapper(queryClient) }
    );

    await act(async () => {
      await result.current.mutateAsync({ name: "foo" }).catch(() => {});
    });

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(
        "foo failed",
        "error",
        expect.objectContaining({ id: "toast-id", description: "boom" })
      );
    });
  });
});
