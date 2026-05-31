import type { KubeObjectBase } from "@my-project/shared";
import { CompactEventsCard } from "./CompactEventsCard";
import { MetadataCard } from "./MetadataCard";

/**
 * Shared right-rail for workload overviews: recent events + labels + annotations.
 * Mirrors the Pod detail page's `PodOverviewSidebar` minus the pod-only ports card.
 */
export function WorkloadOverviewSidebar({ item }: { item: KubeObjectBase }) {
  return (
    <div className="flex flex-col gap-3">
      <CompactEventsCard item={item} />
      <MetadataCard title="Labels" entries={item.metadata?.labels ?? {}} />
      <MetadataCard title="Annotations" entries={item.metadata?.annotations ?? {}} />
    </div>
  );
}
