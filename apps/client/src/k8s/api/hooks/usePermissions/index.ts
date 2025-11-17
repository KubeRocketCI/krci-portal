import { DefinedUseQueryResult, useQuery, useQueryClient } from "@tanstack/react-query";
import { defaultPermissions, DefaultPermissionListCheckResult } from "@my-project/shared";
import { useShallow } from "zustand/react/shallow";
import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { getK8sItemPermissionsQueryCacheKey, getK8sAPIQueryCacheKey } from "../useWatch/query-keys";

export const usePermissions = ({
  group,
  version,
  resourcePlural,
}: {
  group: string;
  version: string;
  resourcePlural: string;
}) => {
  const trpc = useTRPCClient();
  const { clusterName, defaultNamespace: namespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );
  const queryClient = useQueryClient();
  const k8sItemPermissionsCacheKey = getK8sItemPermissionsQueryCacheKey(clusterName, namespace, resourcePlural);
  const k8sAPIQueryCacheKey = getK8sAPIQueryCacheKey();

  const permissionsQuery = useQuery({
    queryKey: k8sItemPermissionsCacheKey,
    queryFn: async () => {
      const cachedApiVersion = queryClient.getQueryData<string>(k8sAPIQueryCacheKey);
      let apiVersion = cachedApiVersion || "v1"; // default apiVersion

      if (!cachedApiVersion) {
        apiVersion = await trpc.k8s.apiVersions.query();
        queryClient.setQueryData(k8sAPIQueryCacheKey, apiVersion);
      }

      const res = trpc.k8s.itemPermissions.mutate({
        apiVersion,
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
  });

  return permissionsQuery as DefinedUseQueryResult<DefaultPermissionListCheckResult, Error>;
};
