import { useWatchList } from "@/k8s/api/hooks/useWatch/useWatchList";
import type { K8sResourceConfig, KubeObjectBase } from "@my-project/shared";

export function useK8sResourceList<T extends KubeObjectBase>(config: K8sResourceConfig, namespace: string) {
  return useWatchList<T>({
    resourceConfig: config,
    namespace: config.clusterScoped ? undefined : namespace,
  });
}
