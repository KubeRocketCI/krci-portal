import { useQuery } from "@tanstack/react-query";
import type { FleetSnapshot } from "@my-project/shared";
import { useTRPCClient } from "@/core/providers/trpc";
import type { RequestError } from "@/core/types/global";

export const FLEET_QUERY_KEY = ["agentSubstrate", "getFleet"] as const;

export const FLEET_REFETCH_INTERVAL_MS = 15_000;

/** A hidden browser tab does not refetch (library default). */
export function useFleet() {
  const trpc = useTRPCClient();

  return useQuery<FleetSnapshot, RequestError>({
    queryKey: FLEET_QUERY_KEY,
    queryFn: () => trpc.agentSubstrate.getFleet.query({}),
    refetchInterval: FLEET_REFETCH_INTERVAL_MS,
    staleTime: FLEET_REFETCH_INTERVAL_MS,
    refetchOnMount: true,
  });
}
