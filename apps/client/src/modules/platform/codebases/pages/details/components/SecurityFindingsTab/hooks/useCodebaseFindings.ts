import { useQuery } from "@tanstack/react-query";
import type { CodebaseFindingsInput } from "@my-project/shared";
import { useTRPCClient } from "@/core/providers/trpc";
import { findingsQueryOptions } from "@/modules/platform/security/components/defectdojo/findingsQueryOptions";

export const codebaseFindingsKey = (input: CodebaseFindingsInput) =>
  ["defectDojo", "getCodebaseFindings", input] as const;

/** The Code, Image and Runtime levels of a codebase. The server derives every DefectDojo lookup from the codebase. */
export function useCodebaseFindings(input: CodebaseFindingsInput) {
  const trpc = useTRPCClient();

  return useQuery({
    queryKey: codebaseFindingsKey(input),
    queryFn: () => trpc.defectDojo.getCodebaseFindings.query(input),
    ...findingsQueryOptions,
  });
}
