import { useMemo } from "react";
import { k8sPodConfig } from "@my-project/shared";
import type { KubeObjectBase, Pod } from "@my-project/shared";
import { useK8sResourceList } from "./useK8sResourceList";

interface UseOwnedPodsOptions {
  /** Label selector to use when the workload has no `spec.selector.matchLabels` (e.g. Job → `job-name`). */
  fallbackLabels?: Record<string, string>;
}

/**
 * Returns the pods owned by a workload by matching the workload's
 * `spec.selector.matchLabels` against pod labels within the same namespace.
 *
 * Mirrors the existing client-side filter pattern (see the Pod detail sidebar's
 * events card) rather than relying on server-side label selectors, keeping it
 * consistent with how related resources are already surfaced.
 */
export function useOwnedPods(
  workload: KubeObjectBase,
  options?: UseOwnedPodsOptions
): { pods: Pod[]; isLoading: boolean } {
  const namespace = workload.metadata?.namespace ?? "";
  const result = useK8sResourceList<Pod>(k8sPodConfig, namespace);
  const allPods = result.data.array;

  const spec = (workload as { spec?: { selector?: { matchLabels?: Record<string, string> } } }).spec;
  const matchLabels = spec?.selector?.matchLabels ?? options?.fallbackLabels;

  const pods = useMemo(() => {
    const labels = matchLabels ?? {};
    const keys = Object.keys(labels);
    if (keys.length === 0) return [];
    return allPods.filter((pod) => {
      const podLabels = pod.metadata?.labels ?? {};
      return keys.every((key) => podLabels[key] === labels[key]);
    });
    // matchLabels is recomputed each render; stringify keeps the dep stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPods, JSON.stringify(matchLabels)]);

  return { pods, isLoading: result.isLoading };
}
