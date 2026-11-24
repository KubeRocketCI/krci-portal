import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Fleet, FleetUnreachableReason, ReadyFleet } from "@my-project/shared";
import { useTRPCClient } from "@/core/providers/trpc";
import type { RequestError } from "@/core/types/global";

export const FLEET_QUERY_KEY = ["agentSubstrate", "getFleet"] as const;

export const FLEET_REFETCH_INTERVAL_MS = 15_000;

/** Cap on kept-fleet time; past it the unreachable state replaces the fleet. Measured on the browser clock. */
export const KEEP_LAST_FLEET_MS = 5 * 60_000;

/**
 * `refreshFailure`: the latest refresh found Agent Substrate unreachable; the fleet is the last ready one.
 * `refreshFailingSince`: epoch ms of the first of those failed refreshes, browser clock.
 */
export type FleetData =
  Exclude<Fleet, ReadyFleet> | (ReadyFleet & { refreshFailure?: FleetUnreachableReason; refreshFailingSince?: number });

function keepLastReadyFleet(previous: FleetData | undefined, next: Fleet): FleetData {
  if (next.state !== "unreachable" || previous?.state !== "ready") return next;
  const now = Date.now();
  const since = previous.refreshFailingSince ?? now;
  if (now - since > KEEP_LAST_FLEET_MS) return next;
  return { ...previous, refreshFailure: next.reason, refreshFailingSince: since };
}

/** A hidden browser tab does not refetch (library default). */
export function useFleet() {
  const trpc = useTRPCClient();
  const queryClient = useQueryClient();

  return useQuery<FleetData, RequestError>({
    queryKey: FLEET_QUERY_KEY,
    queryFn: async () => {
      const next = await trpc.agentSubstrate.getFleet.query({});
      return keepLastReadyFleet(queryClient.getQueryData<FleetData>(FLEET_QUERY_KEY), next);
    },
    refetchInterval: FLEET_REFETCH_INTERVAL_MS,
    staleTime: FLEET_REFETCH_INTERVAL_MS,
    refetchOnMount: true,
  });
}
