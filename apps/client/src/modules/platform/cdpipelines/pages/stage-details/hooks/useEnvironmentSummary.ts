import { useQuery } from "@tanstack/react-query";
import type { EnvironmentSummaryInput } from "@my-project/shared";
import { useTRPCClient } from "@/core/providers/trpc";
import { findingsQueryOptions } from "@/modules/platform/security/components/defectdojo/findingsQueryOptions";

export const environmentSummaryKey = (input: EnvironmentSummaryInput) =>
  ["defectDojo", "getEnvironmentSummary", input] as const;

/**
 * The findings of an Environment. The Applications and the Overview tab of its Stage page share the answer: the tab
 * opened second asks nothing while the answer has data.
 */
export function useEnvironmentSummary(input: EnvironmentSummaryInput) {
  const trpc = useTRPCClient();

  return useQuery({
    queryKey: environmentSummaryKey(input),
    queryFn: () => trpc.defectDojo.getEnvironmentSummary.query(input),
    ...findingsQueryOptions,
  });
}
