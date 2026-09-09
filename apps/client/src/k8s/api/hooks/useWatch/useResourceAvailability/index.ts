import { useTRPCClient } from "@/core/providers/trpc";
import { useAuth } from "@/core/auth/provider";
import { useClusterStore } from "@/k8s/store";
import { K8sResourceConfig } from "@my-project/shared";
import { useQuery } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";
import { getK8sDiscoveryDocumentQueryCacheKey } from "../query-keys";

/**
 * `pending` — discovery in flight.
 * `served` — the cluster serves the type.
 * `not-served` — the cluster does not serve it; do not fetch or watch.
 * `unknown` — discovery could not answer (401/403/timeout/5xx/malformed). Fail open.
 */
export type ResourceAvailability = "pending" | "served" | "not-served" | "unknown";

/**
 * Ten minutes. The document is re-read on this interval while a consumer is
 * mounted, so an add-on installed mid-session becomes visible without a reload.
 * `staleTime` alone schedules no refetch; the shared QueryClient disables the
 * mount and focus triggers.
 */
const DISCOVERY_REFRESH_MS = 10 * 60 * 1000;

/**
 * Report whether the current cluster serves a resource type.
 *
 * Only types declaring `mayBeAbsent` are discovered; everything else reports
 * `served` without a request. `enabled` must carry the caller's own gate, or a
 * disabled watch still costs a discovery round trip.
 *
 * Caches the whole discovery document per group/version, so a page gating five
 * types of one group costs one request.
 */
export const useResourceAvailability = (resourceConfig: K8sResourceConfig, enabled: boolean): ResourceAvailability => {
  const trpc = useTRPCClient();
  const { isAuthenticated } = useAuth();
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));

  const { group, version, pluralName, mayBeAbsent } = resourceConfig;
  const isGated = mayBeAbsent === true && enabled && isAuthenticated;

  const query = useQuery({
    queryKey: getK8sDiscoveryDocumentQueryCacheKey(clusterName, group, version),
    queryFn: () => trpc.k8s.discoveryDocument.query({ clusterName, group, version }),
    enabled: isGated,
    staleTime: DISCOVERY_REFRESH_MS,
    refetchInterval: DISCOVERY_REFRESH_MS,
  });

  if (!isGated) return "served";
  // The shared QueryClient sets queries.retry to 0, so a failure reaches this branch without backoff.
  if (query.isError) return "unknown";
  if (!query.data) return "pending";
  if (query.data.status === "not-served") return "not-served";

  return query.data.plurals.includes(pluralName) ? "served" : "not-served";
};

export interface AvailabilityGate {
  availability: ResourceAvailability;
  /** The type is known to be absent: settle without fetching. */
  notServed: boolean;
  /** Run the GET and the watch. `unknown` fails open. */
  isEnabled: boolean;
}

/**
 * The gate the watch hooks put in front of their query and subscription.
 *
 * `callerEnabled` is the hook's own condition (name present, `enabled` option),
 * so a disabled watch neither discovers nor fetches.
 */
export const useAvailabilityGate = (resourceConfig: K8sResourceConfig, callerEnabled: boolean): AvailabilityGate => {
  const availability = useResourceAvailability(resourceConfig, callerEnabled);
  const notServed = availability === "not-served";

  return {
    availability,
    notServed,
    isEnabled: callerEnabled && availability !== "pending" && !notServed,
  };
};
