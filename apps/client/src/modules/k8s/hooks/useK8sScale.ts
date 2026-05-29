import { K8sResourceConfig, k8sHorizontalPodAutoscalerConfig } from "@my-project/shared";
import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { getK8sWatchItemQueryCacheKey, getK8sWatchListQueryCacheKey } from "@/k8s/api/hooks/useWatch/query-keys";
import { useK8sActionMutation } from "./useK8sActionMutation";

// Mirror of the server-side enum in scaleWorkload — kinds exposing the /scale subresource.
export const SCALABLE_KINDS = ["Deployment", "StatefulSet", "ReplicaSet", "ReplicationController"] as const;
export type ScalableKind = (typeof SCALABLE_KINDS)[number];
export type ScalableConfig = Omit<K8sResourceConfig, "kind"> & { kind: ScalableKind };

interface ScaleInput {
  namespace: string;
  name: string;
  replicas: number;
}

export function useK8sScale(config: ScalableConfig) {
  const trpc = useTRPCClient();
  const clusterName = useClusterStore((s) => s.clusterName);

  return useK8sActionMutation<ScaleInput, unknown>({
    mutationKey: `scale:${config.kind}`,
    mutationFn: ({ namespace, name, replicas }) =>
      trpc.k8s.scaleWorkload.mutate({
        namespace,
        name,
        resourceConfig: config,
        replicas,
      }),
    messages: {
      loading: ({ name, replicas }) => `Scaling ${config.kind} ${name} to ${replicas}…`,
      success: ({ name, replicas }) => `${config.kind} ${name} scaled to ${replicas}`,
      error: ({ name }) => `Failed to scale ${config.kind} ${name}`,
    },
    invalidationKeys: ({ namespace, name }) => [
      getK8sWatchListQueryCacheKey(clusterName, namespace, config.group, config.pluralName),
      getK8sWatchItemQueryCacheKey(clusterName, namespace, config.group, config.pluralName, name),
      // HPA list refresh covers the visible replica count; the bare watchItem prefix
      // is intentionally omitted to avoid refetching every open HPA detail page in the namespace.
      getK8sWatchListQueryCacheKey(
        clusterName,
        namespace,
        k8sHorizontalPodAutoscalerConfig.group,
        k8sHorizontalPodAutoscalerConfig.pluralName
      ),
    ],
  });
}
