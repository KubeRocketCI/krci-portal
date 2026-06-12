import { useMemo } from "react";
import type { CRDObject } from "@my-project/shared";
import { useCRDList } from "./useCRDList";
import { useAccessibleCRCatalog } from "./useAccessibleCRCatalog";

export interface UseCRDCatalogResult {
  /**
   * Intentionally narrower than the watch result: no `map` — this is a catalog,
   * not a watch, and neither consumer (sidebar, useCRDByGVR) needs the map.
   */
  data: { array: CRDObject[] };
  isLoading: boolean;
  error: Error | null;
}

/**
 * Single source of truth for the CRD catalog, RBAC-adaptive:
 *  - admins who can list CRDs cluster-wide  → live CRD watch (full spec, printer columns)
 *  - restricted users (CRD list FORBIDDEN)  → SelfSubjectRulesReview ∩ discovery
 *    catalog rendered as synthetic CRDObjects
 *
 * Returns the same shape useCRDList consumers already use, so useCRSidebarItems and
 * useCRDByGVR swap to it with a one-line change.
 */
export function useCRDCatalog(): UseCRDCatalogResult {
  const watch = useCRDList();
  // FORBIDDEN is the precise fallback signal: the cluster-scoped CRD watch 403s for
  // users without cluster-wide CRD list rights (handleK8sError maps 403 → FORBIDDEN).
  // Any other failure (timeout, 5xx) keeps the normal error path — falling back there
  // would render a restricted catalog for admins during a transient outage.
  const forbidden = watch.error?.data?.code === "FORBIDDEN";
  const catalog = useAccessibleCRCatalog({ enabled: forbidden });

  const array = forbidden ? catalog.data : watch.data.array;
  const error = forbidden ? catalog.error : watch.error;
  const isLoading = watch.isLoading || (forbidden && catalog.isLoading);

  return useMemo(() => ({ data: { array }, isLoading, error }), [array, isLoading, error]);
}
