import { useTRPCClient } from "@/core/providers/trpc";
import { useQuery } from "@tanstack/react-query";
import type { KrciAuditFacet, KrciAuditFacetField } from "@my-project/shared";

// The filter always needs the same three fields; `operation` is a fixed enum, not a facet.
const AUDIT_FACET_FIELDS: KrciAuditFacetField[] = ["namespace", "kind", "actor"];

// Facets change slowly (they reflect the historical audit trail, not live state), so cache
// aggressively rather than re-fetching every time the filter is opened.
const AUDIT_FACETS_STALE_TIME_MS = 5 * 60 * 1000;
const AUDIT_FACETS_GC_TIME_MS = 10 * 60 * 1000;

// Empty-but-not-truncated is the "degrade gracefully" default: while loading or on error the
// filter still renders a (empty) dropdown for the field instead of crashing.
const EMPTY_FACET: KrciAuditFacet = { values: [], truncated: false };

export interface UseAuditFacetsResult {
  namespace: KrciAuditFacet;
  kind: KrciAuditFacet;
  actor: KrciAuditFacet;
  isLoading: boolean;
}

export function useAuditFacets(): UseAuditFacetsResult {
  const trpc = useTRPCClient();

  const { data, isLoading } = useQuery({
    queryKey: ["krciAudit", "getAuditFacets", AUDIT_FACET_FIELDS],
    queryFn: () => trpc.krciAudit.getAuditFacets.query({ fields: AUDIT_FACET_FIELDS }),
    staleTime: AUDIT_FACETS_STALE_TIME_MS,
    gcTime: AUDIT_FACETS_GC_TIME_MS,
  });

  return {
    namespace: data?.namespace ?? EMPTY_FACET,
    kind: data?.kind ?? EMPTY_FACET,
    actor: data?.actor ?? EMPTY_FACET,
    isLoading,
  };
}
