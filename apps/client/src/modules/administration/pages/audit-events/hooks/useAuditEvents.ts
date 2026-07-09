import { useTRPCClient } from "@/core/providers/trpc";
import { useQuery } from "@tanstack/react-query";
import type { KrciAuditEvent, KrciAuditOperation } from "@my-project/shared";
import type { AuditEventListFilterValues } from "../components/AuditEventFilter/types";

export const AUDIT_EVENTS_DEFAULT_PER_PAGE = 20;

// krci-audit rejects perPage > 100 (oapi.yaml); callers clamp to this before querying.
export const AUDIT_EVENTS_MAX_PER_PAGE = 100;

interface UseAuditEventsResult {
  events: KrciAuditEvent[];
  total: number;
  isLoading: boolean;
  error: Error | null;
}

function toOperationFilter(value: string): KrciAuditOperation | undefined {
  return value === "all" || value === "" ? undefined : (value as KrciAuditOperation);
}

function toStringFilter(value: string): string | undefined {
  return value === "" ? undefined : value;
}

// Exported so tests/stories can reconstruct the exact query cache key this hook uses.
export function toAuditEventsQueryInput(
  filterValues: AuditEventListFilterValues,
  page: number = 1,
  perPage: number = AUDIT_EVENTS_DEFAULT_PER_PAGE
) {
  return {
    kind: toStringFilter(filterValues.kind),
    namespace: toStringFilter(filterValues.namespace),
    operation: toOperationFilter(filterValues.operation),
    actor: toStringFilter(filterValues.actor),
    from: toStringFilter(filterValues.from),
    to: toStringFilter(filterValues.to),
    page,
    perPage,
  };
}

export function useAuditEvents(
  filterValues: AuditEventListFilterValues,
  page: number = 1,
  perPage: number = AUDIT_EVENTS_DEFAULT_PER_PAGE
): UseAuditEventsResult {
  const trpc = useTRPCClient();

  const queryInput = toAuditEventsQueryInput(filterValues, page, perPage);

  const { data, isLoading, error } = useQuery({
    queryKey: ["krciAudit", "getAuditEvents", queryInput],
    queryFn: () => trpc.krciAudit.getAuditEvents.query(queryInput),
    // Keep the current page visible while the next page loads so paging doesn't flash
    // an empty table between fetches.
    placeholderData: (previousData) => previousData,
  });

  return {
    events: data?.data ?? [],
    total: data?.pagination.total ?? 0,
    isLoading,
    error: error as Error | null,
  };
}
