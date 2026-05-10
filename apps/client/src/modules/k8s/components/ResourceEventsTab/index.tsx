import { useK8sResourceList } from "../../hooks/useK8sResourceList";
import { k8sEventConfig } from "@my-project/shared";
import type { KubeObjectBase } from "@my-project/shared";

interface K8sEvent extends KubeObjectBase {
  type?: string;
  reason?: string;
  message?: string;
  involvedObject?: {
    kind?: string;
    namespace?: string;
    name?: string;
    uid?: string;
  };
}

export function ResourceEventsTab({ item }: { item: KubeObjectBase }) {
  const result = useK8sResourceList<K8sEvent>(k8sEventConfig, item.metadata?.namespace ?? "");
  const events = (result.data as { array?: K8sEvent[] } | undefined)?.array ?? [];
  const filtered = events.filter(
    (e) =>
      e.involvedObject?.uid === item.metadata?.uid ||
      (e.involvedObject?.kind === item.kind &&
        e.involvedObject?.name === item.metadata?.name &&
        e.involvedObject?.namespace === item.metadata?.namespace)
  );

  if (filtered.length === 0) {
    return <div className="text-muted-foreground p-4 text-sm">No events for this resource.</div>;
  }

  return (
    <ul className="divide-y">
      {filtered.map((e, i) => (
        <li key={i} className="px-4 py-2 text-sm">
          <span
            className={`mr-2 inline-block h-2 w-2 rounded-full ${
              e.type === "Warning" ? "bg-amber-500" : "bg-emerald-500"
            }`}
            aria-hidden
          />
          <span className="font-mono">{e.reason}</span>
          <span className="text-muted-foreground ml-2">{e.message}</span>
        </li>
      ))}
    </ul>
  );
}
