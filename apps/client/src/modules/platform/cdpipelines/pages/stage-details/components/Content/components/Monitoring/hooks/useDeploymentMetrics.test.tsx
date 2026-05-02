import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useDeploymentMetrics } from "./useDeploymentMetrics";
import type { DeploymentMetricsOutput } from "@my-project/shared";

const mockQuery = vi.fn();

vi.mock("@/core/providers/trpc", () => ({
  useTRPCClient: () => ({
    prometheus: {
      getDeploymentMetrics: { query: mockQuery },
    },
  }),
}));

const okResponse: DeploymentMetricsOutput = {
  cpu: [],
  memory: [],
  restarts: [],
  range: "1h",
  queriedAt: 1700000000,
};

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, Wrapper };
}

describe("useDeploymentMetrics", () => {
  beforeEach(() => {
    mockQuery.mockReset();
    mockQuery.mockResolvedValue(okResponse);
  });

  it("calls the tRPC client and exposes data", async () => {
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(
      () =>
        useDeploymentMetrics({
          clusterName: "in-cluster",
          namespace: "test-namespace",
          applications: ["test-app"],
          range: "1h",
          autoRefresh: true,
          enabled: true,
        }),
      { wrapper: Wrapper }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(okResponse);
  });

  it("uses a stable query key across applications reordering (cache hit)", async () => {
    const { Wrapper } = makeWrapper();
    const { result: a } = renderHook(
      () =>
        useDeploymentMetrics({
          clusterName: "in-cluster",
          namespace: "ns",
          applications: ["b", "a"],
          range: "1h",
          autoRefresh: true,
          enabled: true,
        }),
      { wrapper: Wrapper }
    );
    await waitFor(() => expect(a.current.isSuccess).toBe(true));

    const { result: b } = renderHook(
      () =>
        useDeploymentMetrics({
          clusterName: "in-cluster",
          namespace: "ns",
          applications: ["a", "b"],
          range: "1h",
          autoRefresh: true,
          enabled: true,
        }),
      { wrapper: Wrapper }
    );
    await waitFor(() => expect(b.current.isSuccess).toBe(true));
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it("disables refetchInterval when autoRefresh is false", async () => {
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(
      () =>
        useDeploymentMetrics({
          clusterName: "in-cluster",
          namespace: "ns",
          applications: ["app"],
          range: "1h",
          autoRefresh: false,
          enabled: true,
        }),
      { wrapper: Wrapper }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const initialCalls = mockQuery.mock.calls.length;
    await new Promise((r) => setTimeout(r, 100));
    expect(mockQuery.mock.calls.length).toBe(initialCalls);
  });

  it("respects enabled=false (no fetch)", async () => {
    const { Wrapper } = makeWrapper();
    renderHook(
      () =>
        useDeploymentMetrics({
          clusterName: "in-cluster",
          namespace: "ns",
          applications: ["app"],
          range: "1h",
          autoRefresh: true,
          enabled: false,
        }),
      { wrapper: Wrapper }
    );
    await new Promise((r) => setTimeout(r, 50));
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("retains previous data across a rejected refetch (placeholderData: keepPreviousData)", async () => {
    // Use retryDelay: 0 so the hook's retry: 1 fires immediately in tests.
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, retryDelay: 0 } },
    });
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    mockQuery.mockResolvedValueOnce(okResponse);
    const { result, rerender } = renderHook(
      ({ range }: { range: "1h" | "5m" }) =>
        useDeploymentMetrics({
          clusterName: "in-cluster",
          namespace: "ns",
          applications: ["app"],
          range,
          autoRefresh: true,
          enabled: true,
        }),
      { wrapper: Wrapper, initialProps: { range: "1h" as "1h" | "5m" } }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(okResponse);

    // Trigger a new query (different range -> different cache key) that never resolves.
    // While the new query is in-flight, keepPreviousData serves the previous result
    // as placeholder data so charts remain on screen.
    let resolveNext!: (v: unknown) => void;
    mockQuery.mockImplementationOnce(
      () =>
        new Promise((res) => {
          resolveNext = res;
        })
    );
    rerender({ range: "5m" });

    // During the pending phase of the new key, previous data is visible as placeholder.
    await waitFor(() => expect(result.current.isPlaceholderData).toBe(true));
    expect(result.current.data).toEqual(okResponse);

    // Clean up: resolve the pending query so the hook can settle.
    resolveNext(okResponse);
    await waitFor(() => expect(result.current.isPlaceholderData).toBe(false));
  });
});
