import { useMemo } from "react";
import { useWatchItem } from "@/k8s/api/hooks/useWatch/useWatchItem";
import type { CRDObject, KubeObjectBase } from "@my-project/shared";
import { buildCRDescriptor } from "../registry/dynamic/buildCRDescriptor";

export function useCR(
  crd: CRDObject,
  namespace: string,
  name: string,
  preferredVersion?: string,
  options?: { enabled?: boolean }
) {
  // Narrow dep to resourceVersion: useWatchList rebuilds the CRD array on every
  // watch tick, so closing over `crd` would re-run buildCRDescriptor on each event.
  // CRD identity is tracked by resourceVersion; nothing else here depends on the
  // object reference itself.
  const config = useMemo(
    () => buildCRDescriptor(crd, preferredVersion).config,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [crd.metadata?.resourceVersion, crd.metadata?.uid, preferredVersion]
  );
  return useWatchItem<KubeObjectBase>({
    resourceConfig: config,
    namespace,
    name,
    queryOptions: { enabled: options?.enabled ?? true },
  });
}
