import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useTriggeredBy } from "./useTriggeredBy";
import { TriggeredBy } from "@my-project/shared";

const mockQuery = vi.fn();

vi.mock("@/core/providers/trpc", () => ({
  useTRPCClient: () => ({
    krciAudit: {
      getTriggeredBy: { query: mockQuery },
    },
  }),
}));

const mockClusterStoreState = { clusterName: "test-cluster" };
vi.mock("@/k8s/store", () => ({
  useClusterStore: Object.assign(
    vi.fn((selector) => (selector ? selector(mockClusterStoreState) : mockClusterStoreState)),
    { setState: vi.fn(), getState: vi.fn(() => mockClusterStoreState) }
  ),
}));

function makeWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { Wrapper };
}

describe("useTriggeredBy", () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it("requests the actor by namespace/name and exposes the classified result", async () => {
    const response: TriggeredBy = { actorClass: "human", actor: "dev@example.com", displayName: "dev@example.com" };
    mockQuery.mockResolvedValue(response);

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useTriggeredBy("krci", "run-abc"), { wrapper: Wrapper });

    await waitFor(() => expect(result.current).toEqual(response));
    expect(mockQuery).toHaveBeenCalledWith({ namespace: "krci", name: "run-abc" });
  });

  it("returns undefined (no crash) while loading or when the query fails", async () => {
    mockQuery.mockRejectedValue(new Error("krci-audit unavailable"));

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useTriggeredBy("krci", "run-down"), { wrapper: Wrapper });

    expect(result.current).toBeUndefined();
    await waitFor(() => expect(mockQuery).toHaveBeenCalled());
    expect(result.current).toBeUndefined();
  });

  it("does not call the API until namespace and name are present", async () => {
    const { Wrapper } = makeWrapper();
    renderHook(() => useTriggeredBy(undefined, undefined), { wrapper: Wrapper });

    await new Promise((r) => setTimeout(r, 50));
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("does not call the API when explicitly disabled", async () => {
    const { Wrapper } = makeWrapper();
    renderHook(() => useTriggeredBy("krci", "run-abc", false), { wrapper: Wrapper });

    await new Promise((r) => setTimeout(r, 50));
    expect(mockQuery).not.toHaveBeenCalled();
  });
});
