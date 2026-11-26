import { useQuery } from "@tanstack/react-query";
import {
  isRuntimeFindingState,
  type DefectDojoFindingState,
  type SecurityOverviewCodebasesRequest,
  type SecurityOverviewRequest,
} from "@my-project/shared";
import { useTRPCClient } from "@/core/providers/trpc";
import { findingsStaleTime } from "@/modules/platform/security/components/defectdojo/findingsStaleTime";

export const securityOverviewKey = (input: SecurityOverviewRequest) =>
  ["defectDojo", "getSecurityOverview", input] as const;

export const securityOverviewCodebasesKey = (input: SecurityOverviewCodebasesRequest) =>
  ["defectDojo", "getSecurityOverviewCodebases", input] as const;

export interface SecurityOverviewOptions {
  /** The installation namespace. */
  namespace: string;
  state: DefectDojoFindingState;
}

/**
 * Both parts of the overview, asked for at once: the Code and Image cards come from the Codebases part. Under a state
 * Runtime does not have, Mitigated, the Runtime part is not asked for: `runtime` is `null`.
 */
export function useSecurityOverview({ namespace, state }: SecurityOverviewOptions) {
  const trpc = useTRPCClient();
  const askedForRuntime = isRuntimeFindingState(state);
  // Off under Mitigated, the query keeps Active's key and may hold an Active answer: `runtime` is `null` then.
  const runtimeInput: SecurityOverviewRequest = { namespace, state: askedForRuntime ? state : "active" };

  const runtime = useQuery({
    queryKey: securityOverviewKey(runtimeInput),
    queryFn: () => trpc.defectDojo.getSecurityOverview.query(runtimeInput),
    staleTime: findingsStaleTime,
    refetchOnMount: true,
    enabled: namespace !== "" && askedForRuntime,
  });

  const codebases = useQuery({
    queryKey: securityOverviewCodebasesKey({ namespace, state }),
    queryFn: () => trpc.defectDojo.getSecurityOverviewCodebases.query({ namespace, state }),
    staleTime: findingsStaleTime,
    refetchOnMount: true,
    enabled: namespace !== "",
  });

  return { runtime: askedForRuntime ? runtime : null, codebases };
}
