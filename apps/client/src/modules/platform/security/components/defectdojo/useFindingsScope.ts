import { useQuery } from "@tanstack/react-query";
import type { FindingsScopeInput } from "@my-project/shared";
import { useTRPCClient } from "@/core/providers/trpc";
import { findingsStaleTime } from "./findingsStaleTime";

export const findingsScopeKey = (input: FindingsScopeInput) => ["defectDojo", "getFindingsScope", input] as const;

export function useFindingsScope(input: FindingsScopeInput) {
  const trpc = useTRPCClient();

  return useQuery({
    queryKey: findingsScopeKey(input),
    queryFn: () => trpc.defectDojo.getFindingsScope.query(input),
    staleTime: findingsStaleTime,
    refetchOnMount: true,
    enabled: input.namespace !== "",
  });
}
