import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import type { AgentReviewRuns } from "@my-project/shared";
import { agentReviewRunsQueryKey, useAgentReviewRuns } from "./useAgentReviewRuns";

const mockQuery = vi.fn();

vi.mock("@/core/providers/trpc", () => ({
  useTRPCClient: () => ({
    agentSubstrate: {
      getAgentReviewRuns: { query: mockQuery },
    },
  }),
}));

const REF = { atespace: "krci-agents", name: "issue-2-32" };
const READ: AgentReviewRuns = { mergeRequests: [] };

function makeWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, Wrapper };
}

describe("useAgentReviewRuns", () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it("reads getAgentReviewRuns with the atespace and actor name and caches the read under its query key", async () => {
    mockQuery.mockResolvedValue(READ);

    const { client, Wrapper } = makeWrapper();
    const { result } = renderHook(() => useAgentReviewRuns(REF), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.data).toEqual(READ));
    expect(mockQuery).toHaveBeenCalledWith(REF);
    expect(client.getQueryData(["agentSubstrate", "getAgentReviewRuns", REF])).toEqual(READ);
    expect(agentReviewRunsQueryKey(REF)).toEqual(["agentSubstrate", "getAgentReviewRuns", REF]);
  });

  it("gives the error of a failed read", async () => {
    mockQuery.mockRejectedValue(new Error("Review run read failed"));

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useAgentReviewRuns(REF), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.error?.message).toBe("Review run read failed"));
  });

  it("does not read when disabled", async () => {
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useAgentReviewRuns(REF, { enabled: false }), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockQuery).not.toHaveBeenCalled();
  });
});
