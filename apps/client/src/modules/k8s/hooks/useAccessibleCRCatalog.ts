import { useQuery } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";
import type { AccessibleCustomResource, CRDObject } from "@my-project/shared";
import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { getK8sAccessibleCustomResourcesQueryCacheKey } from "@/k8s/api/hooks/useWatch/query-keys";

/**
 * Maps a permission-derived catalog entry to a SYNTHETIC CRDObject so every existing
 * CRD consumer (useCRDByGVR, buildCRDescriptor, CR list/detail views, sidebar) works
 * unchanged. The synthetic object intentionally carries no schema or
 * additionalPrinterColumns — catalog-path users get the default Name/Age columns.
 * Admins keep the full CRD watch with real printer columns.
 */
export function toSyntheticCRD(cr: AccessibleCustomResource): CRDObject {
  return {
    apiVersion: "apiextensions.k8s.io/v1",
    kind: "CustomResourceDefinition",
    metadata: {
      name: `${cr.plural}.${cr.group}`,
      uid: `${cr.plural}.${cr.group}`,
      // Real CRDs bump resourceVersion whenever spec.versions changes, which is what
      // busts version-sensitive descriptor memos downstream (useCRList and friends).
      // The synthetic object has no API server to do that, so encode the served
      // version here — a catalog refetch that changes the served version for the
      // same GVR must invalidate the descriptor instead of hitting a removed API
      // version.
      resourceVersion: cr.version,
      creationTimestamp: "",
    },
    spec: {
      group: cr.group,
      scope: cr.namespaced ? "Namespaced" : "Cluster",
      names: { kind: cr.kind, plural: cr.plural, singular: cr.singular },
      versions: [{ name: cr.version, served: true, storage: true }],
    },
  };
}

// Stable fallback so useCRDCatalog's memo deps don't churn on every render
// while the query has no data yet.
const EMPTY_CATALOG: CRDObject[] = [];

/**
 * Fetches the SelfSubjectRulesReview ∩ discovery catalog and returns it as synthetic
 * CRDObjects. Cached per (cluster, namespace); switching the default namespace
 * refetches transparently. `enabled` is driven by useCRDCatalog — the catalog is
 * fetched only when the cluster-scoped CRD watch is forbidden.
 */
export function useAccessibleCRCatalog({ enabled }: { enabled: boolean }): {
  data: CRDObject[];
  isLoading: boolean;
  error: Error | null;
} {
  const trpc = useTRPCClient();
  const { clusterName, defaultNamespace: namespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );

  const query = useQuery({
    queryKey: getK8sAccessibleCustomResourcesQueryCacheKey(clusterName, namespace),
    queryFn: async () => {
      const list = await trpc.k8s.accessibleCustomResources.query({ clusterName, namespace });
      return list.map(toSyntheticCRD);
    },
    enabled: enabled && !!clusterName && !!namespace,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return { data: query.data ?? EMPTY_CATALOG, isLoading: query.isLoading, error: query.error };
}
