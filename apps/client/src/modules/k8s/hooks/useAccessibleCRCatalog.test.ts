import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import type { AccessibleCustomResource } from "@my-project/shared";
import { createTestQueryClient } from "@/test/utils";

const queryMock = vi.fn();
vi.mock("@/core/providers/trpc", () => ({
  useTRPCClient: () => ({ k8s: { accessibleCustomResources: { query: queryMock } } }),
}));
vi.mock("@/k8s/store", () => ({
  useClusterStore: (sel: (s: { clusterName: string; defaultNamespace: string }) => unknown) =>
    sel({ clusterName: "test-cluster", defaultNamespace: "edp-delivery" }),
}));

import { toSyntheticCRD, useAccessibleCRCatalog } from "./useAccessibleCRCatalog";

const entry: AccessibleCustomResource = {
  group: "v2.edp.epam.com",
  version: "v1",
  plural: "codebasebranches",
  kind: "CodebaseBranch",
  singular: "codebasebranch",
  namespaced: true,
  verbs: ["*"],
  editable: true,
};

// Factory so each test gets an isolated cache while the client stays stable
// across re-renders (a `new QueryClient` inside the component body would reset
// the cache on every render).
const createWrapper = () => {
  const client = createTestQueryClient();
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
};

describe("toSyntheticCRD", () => {
  it("maps a namespaced catalog entry to a CRDObject with a single served storage version", () => {
    expect(toSyntheticCRD(entry)).toEqual({
      apiVersion: "apiextensions.k8s.io/v1",
      kind: "CustomResourceDefinition",
      metadata: {
        name: "codebasebranches.v2.edp.epam.com",
        uid: "codebasebranches.v2.edp.epam.com",
        resourceVersion: "v1",
        creationTimestamp: "",
      },
      spec: {
        group: "v2.edp.epam.com",
        scope: "Namespaced",
        names: { kind: "CodebaseBranch", plural: "codebasebranches", singular: "codebasebranch" },
        versions: [{ name: "v1", served: true, storage: true }],
      },
    });
  });

  it("maps a cluster-scoped entry to scope Cluster", () => {
    expect(toSyntheticCRD({ ...entry, namespaced: false }).spec.scope).toBe("Cluster");
  });
});

describe("useAccessibleCRCatalog", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches the catalog for the stored cluster/namespace and maps it to synthetic CRDs", async () => {
    queryMock.mockResolvedValueOnce([entry]);
    const { result } = renderHook(() => useAccessibleCRCatalog({ enabled: true }), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.data).toHaveLength(1));
    expect(queryMock).toHaveBeenCalledWith({ clusterName: "test-cluster", namespace: "edp-delivery" });
    expect(result.current.data[0].metadata.name).toBe("codebasebranches.v2.edp.epam.com");
    expect(result.current.error).toBeNull();
  });

  it("does not fetch when disabled", () => {
    const { result } = renderHook(() => useAccessibleCRCatalog({ enabled: false }), { wrapper: createWrapper() });

    expect(queryMock).not.toHaveBeenCalled();
    expect(result.current.data).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it("surfaces the query error with an empty data array", async () => {
    queryMock.mockRejectedValueOnce(new Error("SSRR failed"));
    const { result } = renderHook(() => useAccessibleCRCatalog({ enabled: true }), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error?.message).toBe("SSRR failed");
    expect(result.current.data).toEqual([]);
  });
});
