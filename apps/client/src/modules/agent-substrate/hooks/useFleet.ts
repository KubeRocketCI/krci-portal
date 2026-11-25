import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Fleet } from "@my-project/shared";
import { useTRPCClient } from "@/core/providers/trpc";
import type { RequestError } from "@/core/types/global";
import { keepLastReady, type KeptRead } from "../utils/keepLastReady";

export const FLEET_QUERY_KEY = ["agentSubstrate", "getFleet"] as const;

export const FLEET_REFETCH_INTERVAL_MS = 15_000;

export type FleetData = KeptRead<Fleet>;

/** A hidden browser tab does not refetch (library default). */
export function useFleet() {
  const trpc = useTRPCClient();
  const queryClient = useQueryClient();

  return useQuery<FleetData, RequestError>({
    queryKey: FLEET_QUERY_KEY,
    queryFn: async () => {
      const next = await trpc.agentSubstrate.getFleet.query({});
      return keepLastReady(queryClient.getQueryData<FleetData>(FLEET_QUERY_KEY), next);
    },
    refetchInterval: FLEET_REFETCH_INTERVAL_MS,
    staleTime: FLEET_REFETCH_INTERVAL_MS,
    refetchOnMount: true,
  });
}
