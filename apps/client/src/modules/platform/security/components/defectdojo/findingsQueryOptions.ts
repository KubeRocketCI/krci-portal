const FINDINGS_STALE_TIME_MS = 5 * 60 * 1000;

/**
 * The client keeps a result with data for five minutes. A result that carries no data (DefectDojo is
 * unreachable or not configured, the scan is gone) is stale at once: with `refetchOnMount: true` the next
 * visit asks again.
 */
function findingsStaleTime(query: { state: { data: { state: string } | undefined } }): number {
  return query.state.data?.state === "data" ? FINDINGS_STALE_TIME_MS : 0;
}

/** The options of every findings query: the app client does not refetch on mount unless a query asks for it. */
export const findingsQueryOptions = { staleTime: findingsStaleTime, refetchOnMount: true } as const;
