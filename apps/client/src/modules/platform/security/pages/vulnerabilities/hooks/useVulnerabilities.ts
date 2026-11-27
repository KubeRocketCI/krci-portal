import { useQuery } from "@tanstack/react-query";
import type { VulnerabilitiesInput } from "@my-project/shared";
import { useTRPCClient } from "@/core/providers/trpc";
import { findingsQueryOptions } from "@/modules/platform/security/components/defectdojo/findingsQueryOptions";

export const vulnerabilitiesKey = (input: VulnerabilitiesInput) => ["defectDojo", "getVulnerabilities", input] as const;

export function useVulnerabilities(input: VulnerabilitiesInput) {
  const trpc = useTRPCClient();

  return useQuery({
    queryKey: vulnerabilitiesKey(input),
    queryFn: () => trpc.defectDojo.getVulnerabilities.query(input),
    ...findingsQueryOptions,
    // The page stays while the next one loads, but not under the columns of another level.
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[2].level === input.level ? previous : undefined,
    enabled: input.namespace !== "",
  });
}
