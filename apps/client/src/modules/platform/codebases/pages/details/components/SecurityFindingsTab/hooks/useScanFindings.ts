import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ScanFindingsInput } from "@my-project/shared";
import { useTRPCClient } from "@/core/providers/trpc";
import { findingsQueryOptions } from "@/modules/platform/security/components/defectdojo/findingsQueryOptions";

export const scanFindingsKey = (input: ScanFindingsInput) => ["defectDojo", "getScanFindings", input] as const;

/**
 * One page of the findings of a scan. The scan is named by its typed identity; the server resolves its test.
 * The page on screen stays until the next page, size or filter has loaded.
 */
export function useScanFindings(input: ScanFindingsInput) {
  const trpc = useTRPCClient();

  return useQuery({
    queryKey: scanFindingsKey(input),
    queryFn: () => trpc.defectDojo.getScanFindings.query(input),
    ...findingsQueryOptions,
    placeholderData: keepPreviousData,
  });
}
