import { k8sCustomResourceDefinitionConfig, type CRDObject } from "@my-project/shared";
import { useWatchList } from "@/k8s/api/hooks/useWatch/useWatchList";

/**
 * Watches every CRD in the cluster. Consumed only through useCRDCatalog (which
 * serves the CR sidebar hook and useCRDByGVR). Callers MUST NOT pass labels —
 * the watch-sharing invariant requires identical TanStack Query keys.
 */
export function useCRDList() {
  return useWatchList<CRDObject>({ resourceConfig: k8sCustomResourceDefinitionConfig });
}
