import { k8sCustomResourceDefinitionConfig, type CRDObject } from "@my-project/shared";
import { useWatchItem } from "@/k8s/api/hooks/useWatch/useWatchItem";

/**
 * Watches a single CRD by name. CRDs are cluster-scoped, so no namespace is needed.
 */
export function useCRD(name: string) {
  return useWatchItem<CRDObject>({
    resourceConfig: k8sCustomResourceDefinitionConfig,
    name,
  });
}
