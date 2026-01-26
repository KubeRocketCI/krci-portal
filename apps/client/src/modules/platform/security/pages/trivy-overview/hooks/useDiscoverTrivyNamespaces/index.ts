import { useMemo } from "react";
import { useVulnerabilityReportWatchList } from "@/k8s/api/groups/Trivy/VulnerabilityReport/hooks";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";

export interface UseDiscoverTrivyNamespacesResult {
  /**
   * List of namespaces with VulnerabilityReports.
   * For admins: discovered from cluster-wide query.
   * For limited users: falls back to allowedNamespaces from store.
   */
  namespaces: string[];
  /**
   * Whether the discovery is still loading.
   */
  isLoading: boolean;
  /**
   * The default namespace to use when no namespace is selected.
   */
  defaultNamespace: string;
}

/**
 * Hook to discover namespaces that contain Trivy VulnerabilityReports.
 *
 * For users with cluster-wide read access (admins):
 * - Attempts to list VulnerabilityReports across all namespaces
 * - Extracts unique namespaces from the reports
 *
 * For users with limited namespace access:
 * - Falls back to allowedNamespaces from the cluster store
 * - This handles 403 Forbidden errors gracefully
 *
 * This approach ensures:
 * - Admins can see all namespaces with security data
 * - Limited users only see their configured namespaces
 * - No breaking changes for existing users
 *
 * Performance note: This fetches all VulnerabilityReports cluster-wide to extract namespaces.
 * In clusters with many reports, consider implementing server-side namespace aggregation.
 * The 5-minute staleTime helps mitigate repeated expensive queries.
 */
export function useDiscoverTrivyNamespaces(): UseDiscoverTrivyNamespacesResult {
  const { defaultNamespace, allowedNamespaces } = useClusterStore(
    useShallow((state) => ({
      defaultNamespace: state.defaultNamespace,
      allowedNamespaces: state.allowedNamespaces,
    }))
  );

  // Try cluster-wide query (empty namespace = all namespaces)
  // If user doesn't have permission, this will return an error (403 Forbidden)
  const clusterWideQuery = useVulnerabilityReportWatchList({
    namespace: "", // Empty string triggers cluster-wide listing
    queryOptions: {
      retry: false, // Don't retry on 403 - it's expected for limited users
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes to avoid repeated cluster-wide queries
    },
  });

  const namespaces = useMemo<string[]>(() => {
    // If we have an error (403 Forbidden or other), fall back to configured namespaces
    if (clusterWideQuery.error) {
      return allowedNamespaces;
    }

    // If query is still loading or no data yet, use configured namespaces temporarily
    if (!clusterWideQuery.data?.array || clusterWideQuery.data.array.length === 0) {
      return allowedNamespaces;
    }

    // Extract unique namespaces from discovered reports
    const discoveredNamespaces = [
      ...new Set(
        clusterWideQuery.data.array
          .map((report) => report.metadata?.namespace)
          .filter((ns): ns is string => Boolean(ns))
      ),
    ].sort((a, b) => a.localeCompare(b));

    // If we discovered namespaces, use them; otherwise fall back to configured
    return discoveredNamespaces.length > 0 ? discoveredNamespaces : allowedNamespaces;
  }, [clusterWideQuery.data?.array, clusterWideQuery.error, allowedNamespaces]);

  return {
    namespaces,
    isLoading: clusterWideQuery.isLoading,
    defaultNamespace,
  };
}
