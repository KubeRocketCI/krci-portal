import { DefinedUseQueryResult, useQuery } from "@tanstack/react-query";
import { defaultPermissions, DefaultPermissionListCheckResult } from "@my-project/shared";
import { useShallow } from "zustand/react/shallow";
import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { getK8sItemPermissionsQueryCacheKey } from "../useWatch/query-keys";

/**
 * Returns create/update/delete permissions for the given resource in the user's
 * default namespace.
 *
 * Note: cluster-scoped resources (Node, PersistentVolume, etc.) are still queried
 * against `defaultNamespace`; the K8s SelfSubjectAccessReview API ignores namespace
 * for cluster-scoped resources and returns the correct cluster-level permission.
 */
export const usePermissions = ({
  group,
  version,
  resourcePlural,
  enabled = true,
}: {
  group: string;
  version: string;
  resourcePlural: string;
  /**
   * Set to false to skip the network call entirely (e.g. while the resource type
   * is still being resolved). The returned `data` falls back to `defaultPermissions`
   * (all denied), keeping action buttons safely disabled until the type is known.
   */
  enabled?: boolean;
}) => {
  const trpc = useTRPCClient();
  const { clusterName, defaultNamespace: namespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );
  const k8sItemPermissionsCacheKey = getK8sItemPermissionsQueryCacheKey(clusterName, namespace, group, resourcePlural);

  const permissionsQuery = useQuery({
    queryKey: k8sItemPermissionsCacheKey,
    queryFn: async () => {
      // The SSARS object's own apiVersion is always authorization.k8s.io/v1 — the
      // server hardcodes it. We previously fetched the cluster's apiVersions endpoint
      // and forwarded the result here, but the server silently discarded the value.
      const res = await trpc.k8s.itemPermissions.mutate({
        clusterName,
        group,
        version,
        namespace,
        resourcePlural,
      });
      return res;
    },
    placeholderData: defaultPermissions,
    staleTime: Infinity,
    gcTime: Infinity,
    enabled,
  });

  // Ensure data is always defined, even on error (use defaultPermissions as fallback)
  // This prevents crashes when K8s API returns 403 (cluster mismatch, token issues, etc.)
  return {
    ...permissionsQuery,
    data: permissionsQuery.data ?? defaultPermissions,
  } as DefinedUseQueryResult<DefaultPermissionListCheckResult, Error>;
};
