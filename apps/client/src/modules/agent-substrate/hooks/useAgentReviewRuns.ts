import { useQuery } from "@tanstack/react-query";
import type { AgentReviewRuns } from "@my-project/shared";
import { useTRPCClient } from "@/core/providers/trpc";
import type { RequestError } from "@/core/types/global";
import type { AgentRef } from "./useAgent";
import { FLEET_REFETCH_INTERVAL_MS } from "./useFleet";

export const agentReviewRunsQueryKey = ({ atespace, name }: AgentRef) =>
  ["agentSubstrate", "getAgentReviewRuns", { atespace, name }] as const;

/** A hidden browser tab does not refetch (React Query default). */
export function useAgentReviewRuns(ref: AgentRef, { enabled = true }: { enabled?: boolean } = {}) {
  const trpc = useTRPCClient();

  return useQuery<AgentReviewRuns, RequestError>({
    queryKey: agentReviewRunsQueryKey(ref),
    queryFn: () => trpc.agentSubstrate.getAgentReviewRuns.query({ atespace: ref.atespace, name: ref.name }),
    refetchInterval: FLEET_REFETCH_INTERVAL_MS,
    staleTime: FLEET_REFETCH_INTERVAL_MS,
    refetchOnMount: true,
    enabled,
  });
}
