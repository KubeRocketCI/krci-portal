import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useAuditFacets } from "./useAuditFacets";
import type { KrciAuditFacetsResponse } from "@my-project/shared";

const mockQuery = vi.fn();

vi.mock("@/core/providers/trpc", () => ({
  useTRPCClient: () => ({
    krciAudit: {
      getAuditFacets: { query: mockQuery },
    },
  }),
}));

function makeWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { Wrapper };
}

describe("useAuditFacets", () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it("requests all three fields", async () => {
    const response: KrciAuditFacetsResponse = {
      namespace: { values: ["default", "krci"], truncated: false },
      kind: { values: ["PipelineRun"], truncated: false },
      actor: { values: ["kubernetes-admin"], truncated: false },
    };
    mockQuery.mockResolvedValue(response);

    const { Wrapper } = makeWrapper();
    renderHook(() => useAuditFacets(), { wrapper: Wrapper });

    await waitFor(() => expect(mockQuery).toHaveBeenCalled());
    expect(mockQuery).toHaveBeenCalledWith({ fields: ["namespace", "kind", "actor"] });
  });

  it("exposes the parsed per-field facets once resolved", async () => {
    const response: KrciAuditFacetsResponse = {
      namespace: { values: ["default", "krci"], truncated: false },
      kind: { values: ["PipelineRun", "Codebase"], truncated: false },
      actor: { values: ["kubernetes-admin"], truncated: false },
    };
    mockQuery.mockResolvedValue(response);

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useAuditFacets(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.namespace).toEqual({ values: ["default", "krci"], truncated: false });
    expect(result.current.kind).toEqual({ values: ["PipelineRun", "Codebase"], truncated: false });
    expect(result.current.actor).toEqual({ values: ["kubernetes-admin"], truncated: false });
  });

  it("surfaces a truncated field as empty values with truncated:true (free-text fallback)", async () => {
    const response: KrciAuditFacetsResponse = {
      namespace: { values: ["default", "krci"], truncated: false },
      kind: { values: [], truncated: true },
      actor: { values: [], truncated: true },
    };
    mockQuery.mockResolvedValue(response);

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useAuditFacets(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.kind).toEqual({ values: [], truncated: true });
    expect(result.current.actor).toEqual({ values: [], truncated: true });
  });

  it("degrades to empty (non-truncated) facets while loading, so the UI never crashes", () => {
    mockQuery.mockReturnValue(new Promise(() => {})); // never resolves

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useAuditFacets(), { wrapper: Wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.namespace).toEqual({ values: [], truncated: false });
    expect(result.current.kind).toEqual({ values: [], truncated: false });
    expect(result.current.actor).toEqual({ values: [], truncated: false });
  });

  it("degrades to empty (non-truncated) facets on a query error", async () => {
    mockQuery.mockRejectedValue(new Error("boom"));

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useAuditFacets(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.namespace).toEqual({ values: [], truncated: false });
    expect(result.current.kind).toEqual({ values: [], truncated: false });
    expect(result.current.actor).toEqual({ values: [], truncated: false });
  });
});
