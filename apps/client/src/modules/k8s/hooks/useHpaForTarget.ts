import { useMemo } from "react";
import { k8sHorizontalPodAutoscalerConfig, type KubeObjectBase } from "@my-project/shared";
import { useWatchList } from "@/k8s/api/hooks/useWatch/useWatchList";
import type { ScalableKind } from "@/modules/k8s/hooks/useK8sScale";

interface Params {
  namespace: string;
  kind: ScalableKind;
  apiVersion: string;
  name: string;
}

interface HpaItem extends KubeObjectBase {
  spec?: {
    scaleTargetRef?: {
      kind?: string;
      name?: string;
      apiVersion?: string;
    };
    minReplicas?: number;
    maxReplicas?: number;
  };
}

// Well-known apiVersions for the workload kinds that HPAs are allowed to target.
// Used as a fallback when the HPA's scaleTargetRef.apiVersion is absent.
const WELL_KNOWN_SCALABLE_API_VERSIONS = new Set(["apps/v1", "v1"]);

// Compare two apiVersion strings tolerantly: equal if both fully match, OR if
// they refer to the same API group (e.g. "apps/v1" vs "apps" vs "v1" elided).
// Kubernetes does not normalize scaleTargetRef.apiVersion, so user-authored HPAs
// may write the group alone, the version alone, or the full form.
//
// When `a` (the HPA's scaleTargetRef.apiVersion) is absent, we cannot confirm the
// group from the HPA side. Instead of unconditionally returning true (which would
// let any same-namespace (kind, name) collision match), we require `b` (the
// workload's apiVersion) to be one of the well-known scalable API versions. Custom
// operator workloads with non-standard apiVersions are unlikely to appear in an HPA
// scaleTargetRef without the apiVersion field, so this is a safe conservative bound.
function apiVersionsCompatible(a: string | undefined, b: string): boolean {
  if (!a) {
    // HPA omitted apiVersion: accept only well-known scalable targets to avoid
    // false matches across API groups on same-namespace name collisions.
    return WELL_KNOWN_SCALABLE_API_VERSIONS.has(b);
  }
  if (a === b) return true;
  // If a string has no "/", treat the whole value as the group name —
  // this accepts "apps" or "apps/v1" interchangeably as scaleTargetRef.apiVersion.
  const groupOf = (s: string) => (s.includes("/") ? s.split("/")[0] : s);
  return groupOf(a) === groupOf(b);
}

export function useHpaForTarget({ namespace, kind, apiVersion, name }: Params): {
  hpa: HpaItem | null;
  isLoading: boolean;
} {
  const query = useWatchList<HpaItem>({ resourceConfig: k8sHorizontalPodAutoscalerConfig, namespace });

  const hpa = useMemo(() => {
    const items = query.data?.map;
    if (!items) return null;
    for (const item of items.values()) {
      const ref = item.spec?.scaleTargetRef;
      // Within a namespace, (kind, name) uniquely identifies the target. apiVersion
      // is verified loosely as a defensive guard against cross-group name collisions.
      if (ref?.kind === kind && ref?.name === name && apiVersionsCompatible(ref?.apiVersion, apiVersion)) {
        return item;
      }
    }
    return null;
  }, [query.data, kind, name, apiVersion]);

  return { hpa, isLoading: query.isLoading };
}
