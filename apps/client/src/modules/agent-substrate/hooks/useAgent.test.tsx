import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import type { AgentRead } from "@my-project/shared";
import { SUSPENDED_AGENT } from "../__fixtures__/storyAgent";
import { agentQueryKey, useAgent } from "./useAgent";

const mockQuery = vi.fn();

vi.mock("@/core/providers/trpc", () => ({
  useTRPCClient: () => ({
    agentSubstrate: {
      getAgent: { query: mockQuery },
    },
  }),
}));

const REF = { atespace: "krci-agents", name: "issue-2-26" };

function makeWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, Wrapper };
}

describe("useAgent", () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it("reads getAgent with the atespace and actor name and caches the read under its query key", async () => {
    mockQuery.mockResolvedValue(SUSPENDED_AGENT);

    const { client, Wrapper } = makeWrapper();
    const { result } = renderHook(() => useAgent(REF), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.data).toEqual(SUSPENDED_AGENT));
    expect(mockQuery).toHaveBeenCalledWith(REF);
    expect(client.getQueryData(["agentSubstrate", "getAgent", REF])).toEqual(SUSPENDED_AGENT);
    expect(agentQueryKey(REF)).toEqual(["agentSubstrate", "getAgent", REF]);
  });

  it("keeps the last ready read when a refresh finds Agent Substrate unreachable", async () => {
    const unreachable: AgentRead = { state: "unreachable", reason: "permissionDenied" };
    mockQuery.mockResolvedValueOnce(SUSPENDED_AGENT).mockResolvedValueOnce(unreachable);

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useAgent(REF), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.data).toEqual(SUSPENDED_AGENT));

    await act(() => result.current.refetch());

    await waitFor(() => expect(mockQuery).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(result.current.data).toMatchObject({ ...SUSPENDED_AGENT, refreshFailure: "permissionDenied" })
    );
  });
});
