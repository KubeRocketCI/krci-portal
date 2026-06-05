import type { KubeObjectBase } from "@my-project/shared";
import { useResourceEvents } from "../../hooks/useResourceEvents";
import { eventToneClass } from "../../constants/event";

export function ResourceEventsTab({ item }: { item: KubeObjectBase }) {
  const { data, isLoading } = useResourceEvents(item);
  const events = data.array;

  if (isLoading) {
    return <div className="text-muted-foreground p-4 text-sm">Loading events…</div>;
  }

  if (events.length === 0) {
    return <div className="text-muted-foreground p-4 text-sm">No events for this resource.</div>;
  }

  return (
    <ul className="divide-y">
      {events.map((e, i) => (
        <li key={i} className="px-4 py-2 text-sm">
          <span className={`mr-2 inline-block h-2 w-2 rounded-full ${eventToneClass(e.type)}`} aria-hidden />
          <span className="font-mono">{e.reason}</span>
          <span className="text-muted-foreground ml-2">{e.message}</span>
        </li>
      ))}
    </ul>
  );
}
