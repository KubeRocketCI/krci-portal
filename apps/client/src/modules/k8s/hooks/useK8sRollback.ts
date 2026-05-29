import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { k8sDeploymentConfig, k8sPodConfig, k8sReplicaSetConfig } from "@my-project/shared";
import {
  getK8sDeploymentRevisionsQueryCacheKey,
  getK8sWatchItemQueryCacheKey,
  getK8sWatchListQueryCacheKey,
} from "@/k8s/api/hooks/useWatch/query-keys";
import { useK8sActionMutation } from "./useK8sActionMutation";

interface RollbackInput {
  namespace: string;
  name: string;
  replicaSetUid: string;
}

export function useK8sRollback() {
  const trpc = useTRPCClient();
  const clusterName = useClusterStore((s) => s.clusterName);

  return useK8sActionMutation<RollbackInput, unknown>({
    mutationKey: "rollback:Deployment",
    mutationFn: ({ namespace, name, replicaSetUid }) =>
      trpc.k8s.rollbackDeployment.mutate({ namespace, name, replicaSetUid }),
    messages: {
      loading: ({ name }) => `Rolling back Deployment ${name}…`,
      success: ({ name }) => `Deployment ${name} rolled back`,
      error: ({ name }) => `Failed to roll back Deployment ${name}`,
    },
    invalidationKeys: ({ namespace, name }) => [
      getK8sWatchListQueryCacheKey(clusterName, namespace, k8sDeploymentConfig.group, k8sDeploymentConfig.pluralName),
      getK8sWatchItemQueryCacheKey(
        clusterName,
        namespace,
        k8sDeploymentConfig.group,
        k8sDeploymentConfig.pluralName,
        name
      ),
      // ReplicaSet revisions and pod template change after rollback
      getK8sWatchListQueryCacheKey(clusterName, namespace, k8sReplicaSetConfig.group, k8sReplicaSetConfig.pluralName),
      getK8sWatchListQueryCacheKey(clusterName, namespace, k8sPodConfig.group, k8sPodConfig.pluralName),
      // Revision dialog query refreshes immediately
      getK8sDeploymentRevisionsQueryCacheKey(clusterName, namespace, name),
    ],
  });
}
