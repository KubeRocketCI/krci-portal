import { useMemo } from "react";
import { useWatchList } from "@/k8s/api/hooks/useWatch/useWatchList";
import type { CRDObject, KubeObjectBase } from "@my-project/shared";
import { buildCRDescriptor } from "../registry/dynamic/buildCRDescriptor";

export function useCRList(crd: CRDObject, namespace?: string, preferredVersion?: string) {
  // Narrow dep to resourceVersion: useWatchList rebuilds the CRD array on every
  // watch tick, so closing over `crd` would re-run buildCRDescriptor on each event.
  const config = useMemo(
    () => buildCRDescriptor(crd, preferredVersion).config,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [crd.metadata?.resourceVersion, crd.metadata?.uid, preferredVersion]
  );
  return useWatchList<KubeObjectBase>({ resourceConfig: config, namespace });
}
