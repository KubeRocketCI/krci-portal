import { K8sResourceConfig, k8sPodConfig } from "@my-project/shared";
import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import {
  getK8sWatchItemQueryCacheKey,
  getK8sWatchItemQueryCacheKeyPrefix,
  getK8sWatchListQueryCacheKey,
} from "@/k8s/api/hooks/useWatch/query-keys";
import { useK8sActionMutation } from "./useK8sActionMutation";

// Mirror of the server-side enum in restartWorkload — kinds that own pods via spec.template.
export const RESTARTABLE_KINDS = ["Deployment", "StatefulSet", "DaemonSet"] as const;
export type RestartableKind = (typeof RESTARTABLE_KINDS)[number];
export type RestartableConfig = Omit<K8sResourceConfig, "kind"> & { kind: RestartableKind };

interface RestartInput {
  namespace: string;
  name: string;
}

export function useK8sRestart(config: RestartableConfig) {
  const trpc = useTRPCClient();
  const clusterName = useClusterStore((s) => s.clusterName);

  return useK8sActionMutation<RestartInput, unknown>({
    mutationKey: `restart:${config.kind}`,
    mutationFn: ({ namespace, name }) =>
      trpc.k8s.restartWorkload.mutate({
        namespace,
        name,
        resourceConfig: config,
      }),
    messages: {
      loading: ({ name }) => `Restarting ${config.kind} ${name}…`,
      success: ({ name }) => `${config.kind} ${name} rollout restarted`,
      error: ({ name }) => `Failed to restart ${config.kind} ${name}`,
    },
    invalidationKeys: ({ namespace, name }) => [
      getK8sWatchListQueryCacheKey(clusterName, namespace, config.group, config.pluralName),
      getK8sWatchItemQueryCacheKey(clusterName, namespace, config.group, config.pluralName, name),
      // Invalidate the pod list so the rollout's new restartedAt is visible immediately.
      getK8sWatchListQueryCacheKey(clusterName, namespace, k8sPodConfig.group, k8sPodConfig.pluralName),
      // Invalidate ALL open pod detail pages in this namespace via a partial prefix key.
      // TanStack Query's invalidateQueries uses prefix matching by default (exact: false),
      // so every ["k8s:watchItem", clusterName, namespace, "", "pods", <podName>] entry is
      // invalidated without having to enumerate individual pod names.
      // The prefix stops at "pods" so no other resource types (e.g. replicasets) are
      // affected by this invalidation.
      getK8sWatchItemQueryCacheKeyPrefix(clusterName, namespace, k8sPodConfig.group, k8sPodConfig.pluralName),
    ],
  });
}
