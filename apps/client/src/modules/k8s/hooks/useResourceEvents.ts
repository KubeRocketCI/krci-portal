import { k8sEventConfig } from "@my-project/shared";
import type { KubeObjectBase, Event as K8sEvent } from "@my-project/shared";
import type { UseWatchListResult } from "@/k8s/api/hooks/useWatch/types";
import { useK8sResourceListPoll } from "./useK8sResourceListPoll";
import { involvedObjectFieldSelector } from "../utils/involvedObjectFieldSelector";
import { EVENTS_POLL_INTERVAL_MS, RESOURCE_EVENTS_FETCH_LIMIT } from "../constants/event";

/**
 * Polls a single resource's own core/v1 Events, scoped server-side by an
 * involvedObject field selector (uid, or kind+name+namespace fallback). When the
 * object carries nothing identifying (no uid and no name) we can't build a
 * selector, so the fetch is skipped rather than pulling the whole namespace and
 * mislabeling unrelated events as the resource's own.
 *
 * Shared by `ResourceEventsTab` (detail tab) and `CompactEventsCard` (sidebar)
 * so the limit/poll-interval/guard stay defined in one place.
 */
export function useResourceEvents(item: KubeObjectBase): UseWatchListResult<K8sEvent> {
  const fieldSelector = involvedObjectFieldSelector(item);
  return useK8sResourceListPoll<K8sEvent>(k8sEventConfig, item.metadata?.namespace ?? "", {
    fieldSelector,
    limit: RESOURCE_EVENTS_FETCH_LIMIT,
    refetchInterval: EVENTS_POLL_INTERVAL_MS,
    enabled: !!fieldSelector,
  });
}
