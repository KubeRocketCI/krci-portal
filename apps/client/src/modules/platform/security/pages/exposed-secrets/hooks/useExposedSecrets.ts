import { keepPreviousData, skipToken, useQuery } from "@tanstack/react-query";
import type { ExposedSecretsInput } from "@my-project/shared";
import { useTRPCClient } from "@/core/providers/trpc";
import { findingsStaleTime } from "@/modules/platform/security/components/defectdojo/findingsStaleTime";

export const exposedSecretsKey = (input: ExposedSecretsInput | null) =>
  ["defectDojo", "getExposedSecrets", input] as const;

/** `null`: not asked for; the list then has no data, not even the page it showed before. */
export function useExposedSecrets(input: ExposedSecretsInput | null) {
  const trpc = useTRPCClient();

  return useQuery({
    queryKey: exposedSecretsKey(input),
    queryFn: input?.namespace ? () => trpc.defectDojo.getExposedSecrets.query(input) : skipToken,
    staleTime: findingsStaleTime,
    refetchOnMount: true,
    placeholderData: input ? keepPreviousData : undefined,
  });
}
