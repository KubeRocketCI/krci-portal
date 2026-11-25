import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AgentRead } from "@my-project/shared";
import { useTRPCClient } from "@/core/providers/trpc";
import type { RequestError } from "@/core/types/global";
import { keepLastReady, type KeptRead } from "../utils/keepLastReady";
import { FLEET_REFETCH_INTERVAL_MS } from "./useFleet";

export interface AgentRef {
  atespace: string;
  name: string;
}

export const agentQueryKey = ({ atespace, name }: AgentRef) =>
  ["agentSubstrate", "getAgent", { atespace, name }] as const;

export type AgentData = KeptRead<AgentRead>;

/** Polls as the fleet does. A hidden browser tab does not refetch (library default). */
export function useAgent(ref: AgentRef) {
  const trpc = useTRPCClient();
  const queryClient = useQueryClient();
  const queryKey = agentQueryKey(ref);

  return useQuery<AgentData, RequestError>({
    queryKey,
    queryFn: async () => {
      const next = await trpc.agentSubstrate.getAgent.query({ atespace: ref.atespace, name: ref.name });
      return keepLastReady(queryClient.getQueryData<AgentData>(queryKey), next);
    },
    refetchInterval: FLEET_REFETCH_INTERVAL_MS,
    staleTime: FLEET_REFETCH_INTERVAL_MS,
    refetchOnMount: true,
  });
}
