import { useQuery } from "@tanstack/react-query";
import type { CodebaseFindingsInput } from "@my-project/shared";
import { useTRPCClient } from "@/core/providers/trpc";
import { findingsQueryOptions } from "@/modules/platform/security/components/defectdojo/findingsQueryOptions";

export const codebaseSecurityLineKey = (input: CodebaseFindingsInput) =>
  ["defectDojo", "getCodebaseSecurityLine", input] as const;

/** The security line of a codebase in one call. The server derives every DefectDojo lookup from the codebase. */
export function useCodebaseSecurityLine(input: CodebaseFindingsInput) {
  const trpc = useTRPCClient();

  return useQuery({
    queryKey: codebaseSecurityLineKey(input),
    queryFn: () => trpc.defectDojo.getCodebaseSecurityLine.query(input),
    ...findingsQueryOptions,
  });
}
