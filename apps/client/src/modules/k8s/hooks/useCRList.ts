import { useMemo } from "react";
import { useWatchList } from "@/k8s/api/hooks/useWatch/useWatchList";
import { useWatchListMultiple } from "@/k8s/api/hooks/useWatch/useWatchListMultiple";
import type { CRDObject, KubeObjectBase } from "@my-project/shared";
import { buildCRDescriptor } from "../registry/dynamic/buildCRDescriptor";

// Narrow dep to resourceVersion/uid: the watch hooks rebuild the CRD array on
// every tick, so closing over `crd` would re-run buildCRDescriptor on each event.
function useCRDConfig(crd: CRDObject, preferredVersion?: string) {
  return useMemo(
    () => buildCRDescriptor(crd, preferredVersion).config,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [crd.metadata?.resourceVersion, crd.metadata?.uid, preferredVersion]
  );
}

export function useCRList(crd: CRDObject, namespace?: string, preferredVersion?: string) {
  const config = useCRDConfig(crd, preferredVersion);
  return useWatchList<KubeObjectBase>({ resourceConfig: config, namespace });
}

/** Namespace-aware {@link useCRList}: lists a custom resource across the cluster's allowed namespaces. */
export function useCRListMulti(crd: CRDObject, namespaces?: string[], preferredVersion?: string) {
  const config = useCRDConfig(crd, preferredVersion);
  return useWatchListMultiple<KubeObjectBase>({
    resourceConfig: config,
    namespaces,
  });
}
