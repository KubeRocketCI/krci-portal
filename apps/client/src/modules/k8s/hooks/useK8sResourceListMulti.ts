import { useWatchListMultiple } from "@/k8s/api/hooks/useWatch/useWatchListMultiple";
import type { K8sResourceConfig, KubeObjectBase } from "@my-project/shared";

export interface UseK8sResourceListMultiOptions {
  /** Namespaces to list across; falls back to the cluster's allowed namespaces when omitted. */
  namespaces?: string[];
}

/**
 * Namespace-aware counterpart to {@link useK8sResourceList}: lists a resource
 * across the cluster's allowed namespaces (or a narrowed selection) so the
 * "Allowed namespaces" setting is honoured rather than only the default namespace.
 */
export function useK8sResourceListMulti<T extends KubeObjectBase>(
  config: K8sResourceConfig,
  options?: UseK8sResourceListMultiOptions
) {
  return useWatchListMultiple<T>({
    resourceConfig: config,
    namespaces: options?.namespaces,
  });
}
