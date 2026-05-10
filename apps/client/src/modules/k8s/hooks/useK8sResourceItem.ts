import { useWatchItem } from "@/k8s/api/hooks/useWatch/useWatchItem";
import type { K8sResourceConfig, KubeObjectBase } from "@my-project/shared";

export function useK8sResourceItem<T extends KubeObjectBase>(
  config: K8sResourceConfig,
  namespace: string,
  name: string
) {
  return useWatchItem<T>({
    resourceConfig: config,
    namespace: config.clusterScoped ? undefined : namespace,
    name,
  });
}
