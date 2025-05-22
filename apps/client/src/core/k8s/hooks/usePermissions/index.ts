import { DefinedUseQueryResult, useQuery, useQueryClient } from "@tanstack/react-query";
import { getK8sAPIQueryCacheKey, getK8sItemPermissionsQueryCacheKey } from "../../query-keys";
import { defaultPermissions, PermissionsResult } from "@my-project/shared";
import { useShallow } from "zustand/react/shallow";
import { trpc } from "@/core/clients/trpc";
import { useClusterStore } from "@/core/store";
import { K8S_DEFAULT_CLUSTER_NAME } from "../../constants";

export const usePermissions = ({
  group,
  version,
  resourcePlural,
}: {
  group: string;
  version: string;
  resourcePlural: string;
}) => {
  const clusterName = K8S_DEFAULT_CLUSTER_NAME;
  const namespace = useClusterStore(useShallow((state) => state.defaultNamespace));
  const queryClient = useQueryClient();
  const k8sItemPermissionsCacheKey = getK8sItemPermissionsQueryCacheKey(clusterName, namespace, resourcePlural);
  const k8sAPIQueryCacheKey = getK8sAPIQueryCacheKey();

  const permissionsQuery = useQuery({
    queryKey: k8sItemPermissionsCacheKey,
    queryFn: async () => {
      const cachedApiVersion = queryClient.getQueryData<string>(k8sAPIQueryCacheKey);
      let apiVersion = "v1"; // default apiVersion

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

  return permissionsQuery as DefinedUseQueryResult<PermissionsResult, Error>;
};
