import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import type { FleetSnapshot } from "@my-project/shared";
import { FLEET_QUERY_KEY, useFleet } from "./useFleet";

const mockQuery = vi.fn();

vi.mock("@/core/providers/trpc", () => ({
  useTRPCClient: () => ({
    agentSubstrate: {
      getFleet: { query: mockQuery },
    },
  }),
}));

function makeWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, Wrapper };
}

describe("useFleet", () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it("reads getFleet with an empty input and caches the snapshot under FLEET_QUERY_KEY", async () => {
    const snapshot: FleetSnapshot = { state: "notConfigured" };
    mockQuery.mockResolvedValue(snapshot);

    const { client, Wrapper } = makeWrapper();
    const { result } = renderHook(() => useFleet(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.data).toEqual(snapshot));
    expect(mockQuery).toHaveBeenCalledWith({});
    expect(client.getQueryData(FLEET_QUERY_KEY)).toEqual(snapshot);
  });

  it("exposes a failed read as the query error", async () => {
    mockQuery.mockRejectedValue(new Error("network"));

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useFleet(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("network");
    expect(result.current.data).toBeUndefined();
  });
});
