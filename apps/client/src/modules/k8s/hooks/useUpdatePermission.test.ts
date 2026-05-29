import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// ---------------------------------------------------------------------------
// Module-level mocks (hoisted before imports)
// ---------------------------------------------------------------------------

const itemPermissionsMutateMock = vi.fn();

vi.mock("@/core/providers/trpc", () => ({
  useTRPCClient: () => ({
    k8s: { itemPermissions: { mutate: itemPermissionsMutateMock } },
  }),
}));

vi.mock("@/k8s/store", () => ({
  useClusterStore: (sel: (s: { clusterName: string; defaultNamespace: string }) => unknown) =>
    sel({ clusterName: "test-cluster", defaultNamespace: "default" }),
}));

import { useUpdatePermission } from "./useUpdatePermission";

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

describe("useUpdatePermission", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns allowed=true when the patch verb is permitted", async () => {
    itemPermissionsMutateMock.mockResolvedValueOnce({
      create: { allowed: false, reason: "" },
      update: { allowed: true, reason: "" },
      patch: { allowed: true, reason: "" },
      delete: { allowed: false, reason: "" },
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useUpdatePermission(config), { wrapper: makeWrapper(queryClient) });

    await waitFor(() => {
      expect(result.current.allowed).toBe(true);
      expect(result.current.reason).toBeFalsy();
    });
  });

  it("returns allowed=true when patch is permitted but update is denied (PATCH-only operators)", async () => {
    // Scale/restart/rollback use HTTP PATCH; operators granted patch-only on a
    // workload must not be blocked by a missing "update" verb.
    itemPermissionsMutateMock.mockResolvedValueOnce({
      create: { allowed: false, reason: "" },
      update: { allowed: false, reason: "update not permitted" },
      patch: { allowed: true, reason: "" },
      delete: { allowed: false, reason: "" },
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useUpdatePermission(config), { wrapper: makeWrapper(queryClient) });

    await waitFor(() => {
      expect(result.current.allowed).toBe(true);
    });
  });

  it("returns allowed=false and surfaces the patch reason when the patch verb is denied", async () => {
    itemPermissionsMutateMock.mockResolvedValueOnce({
      create: { allowed: false, reason: "" },
      update: { allowed: true, reason: "" },
      patch: { allowed: false, reason: "patch not permitted" },
      delete: { allowed: false, reason: "" },
    });
    // update.allowed=true here intentionally does NOT make the action allowed —
    // workloads PATCH, not PUT, so only the patch verb matters.
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useUpdatePermission(config), { wrapper: makeWrapper(queryClient) });

    await waitFor(() => {
      expect(result.current.allowed).toBe(false);
      expect(result.current.reason).toBe("patch not permitted");
    });
  });

  it("returns allowed=false (placeholder) before the permission query resolves", () => {
    // itemPermissionsMutateMock never resolves — the hook must fall back to
    // defaultPermissions (all denied) so action buttons stay safely disabled.
    itemPermissionsMutateMock.mockReturnValue(new Promise(() => {}));
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useUpdatePermission(config), { wrapper: makeWrapper(queryClient) });

    // Synchronous assertion: placeholder data means denied
    expect(result.current.allowed).toBe(false);
  });
});
