import { k8sCustomResourceDefinitionConfig, type CRDObject } from "@my-project/shared";
import { useWatchList } from "@/k8s/api/hooks/useWatch/useWatchList";

/**
 * Watches every CRD in the cluster. Used by the CR sidebar hook and by
 * useCRDByGVR. Both callers MUST NOT pass labels — the watch-sharing
 * invariant requires identical TanStack Query keys.
 */
export function useCRDList() {
  return useWatchList<CRDObject>({ resourceConfig: k8sCustomResourceDefinitionConfig });
}
