import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import type { Fleet } from "@my-project/shared";
import { EMPTY_FLEET } from "../__fixtures__/storyFleet";
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

  it("reads getFleet with an empty input and caches the fleet under FLEET_QUERY_KEY", async () => {
    const fleet: Fleet = { state: "notConfigured" };
    mockQuery.mockResolvedValue(fleet);

    const { client, Wrapper } = makeWrapper();
    const { result } = renderHook(() => useFleet(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.data).toEqual(fleet));
    expect(mockQuery).toHaveBeenCalledWith({});
    expect(client.getQueryData(FLEET_QUERY_KEY)).toEqual(fleet);
  });

  describe("a refresh that finds Agent Substrate unreachable", () => {
    const ready = { ...EMPTY_FLEET, updatedAt: "2026-11-24T09:30:35.000Z" };
    const unreachable: Fleet = { state: "unreachable", reason: "unavailable" };

    const START = Date.parse("2026-11-24T09:30:40.000Z");

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(START);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    /** `[fleet, ms after START]`; a bare fleet is read at START. */
    type Read = Fleet | [Fleet, number];

    async function afterReads(...reads: Read[]) {
      const [first, ...rest] = reads.map((read) => (Array.isArray(read) ? read : ([read, 0] as const)));
      mockQuery.mockResolvedValueOnce(first[0]);
      const { client, Wrapper } = makeWrapper();
      const { result } = renderHook(() => useFleet(), { wrapper: Wrapper });
      // useQuery re-renders only for the result fields read; reading `data` subscribes the hook.
      await waitFor(() => expect(result.current.data).toEqual(first[0]));
      for (const [fleet, ms] of rest) {
        vi.setSystemTime(START + ms);
        mockQuery.mockResolvedValueOnce(fleet);
        await act(() => client.refetchQueries({ queryKey: FLEET_QUERY_KEY }));
      }
      return { client, result };
    }

    const kept = (reason: string, since = START) => ({ ...ready, refreshFailure: reason, refreshFailingSince: since });

    it("keeps the last ready fleet and gives the reason and since when refreshes fail", async () => {
      const { client, result } = await afterReads(ready, unreachable);

      await waitFor(() => expect(result.current.data).toEqual(kept("unavailable")));
      expect(client.getQueryData(FLEET_QUERY_KEY)).toEqual(kept("unavailable"));
    });

    it("keeps the last ready fleet over a second unreachable refresh, with the latest reason and the first since", async () => {
      const { result } = await afterReads(ready, unreachable, [
        { state: "unreachable", reason: "unauthenticated" },
        60_000,
      ]);

      await waitFor(() => expect(result.current.data).toEqual(kept("unauthenticated")));
    });

    it("keeps the last ready fleet up to 5 minutes of failed refreshes", async () => {
      const { result } = await afterReads(ready, unreachable, [unreachable, 5 * 60_000]);

      await waitFor(() => expect(result.current.data).toEqual(kept("unavailable")));
    });

    it("gives the unreachable state after more than 5 minutes of failed refreshes", async () => {
      const { result } = await afterReads(ready, unreachable, [unreachable, 5 * 60_000 + 1]);

      await waitFor(() => expect(result.current.data).toEqual(unreachable));
    });

    it("replaces the kept fleet once a refresh is ready again", async () => {
      const recovered = { ...ready, updatedAt: "2026-11-24T09:31:05.000Z" };
      const { result } = await afterReads(ready, unreachable, recovered);

      await waitFor(() => expect(result.current.data).toEqual(recovered));
    });

    it("gives the unreachable state on the first load", async () => {
      const { result } = await afterReads(unreachable);

      await waitFor(() => expect(result.current.data).toEqual(unreachable));
    });

    it("gives notConfigured after a ready fleet: the portal setting changed", async () => {
      const { result } = await afterReads(ready, { state: "notConfigured" });

      await waitFor(() => expect(result.current.data).toEqual({ state: "notConfigured" }));
    });
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
