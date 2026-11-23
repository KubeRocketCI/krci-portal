import { useQuery } from "@tanstack/react-query";
import type { CodebaseFindingsInput } from "@my-project/shared";
import { useTRPCClient } from "@/core/providers/trpc";
import { findingsStaleTime } from "./findingsStaleTime";

export const codebaseFindingsKey = (input: CodebaseFindingsInput) =>
  ["defectDojo", "getCodebaseFindings", input] as const;

/** The Code and Image scans of a codebase. The server derives every DefectDojo lookup from the codebase. */
export function useCodebaseFindings(input: CodebaseFindingsInput) {
  const trpc = useTRPCClient();

  return useQuery({
    queryKey: codebaseFindingsKey(input),
    queryFn: () => trpc.defectDojo.getCodebaseFindings.query(input),
    staleTime: findingsStaleTime,
    // The app client does not refetch on mount; a stale result without data must be asked again.
    refetchOnMount: true,
  });
}
