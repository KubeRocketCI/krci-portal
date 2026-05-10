import type { KubeObjectBase } from "@my-project/shared";

interface K8sEventLike extends KubeObjectBase {
  type?: string;
  reason?: string;
  message?: string;
  count?: number;
  lastTimestamp?: string;
  firstTimestamp?: string;
  involvedObject?: { kind?: string; name?: string; namespace?: string };
}

export function EventStream({ events }: { events: K8sEventLike[] }) {
  if (events.length === 0) {
    return <div className="text-muted-foreground p-6 text-sm">No events.</div>;
  }
  // Group by lastTimestamp date (yyyy-mm-dd)
  const groups = events.reduce<Record<string, K8sEventLike[]>>((acc, e) => {
    const ts = e.lastTimestamp ?? e.firstTimestamp ?? "";
    const day = ts.slice(0, 10) || "—";
    if (!acc[day]) acc[day] = [];
    acc[day].push(e);
    return acc;
  }, {});
  return (
    <div className="divide-y">
      {Object.entries(groups)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([day, items]) => (
          <section key={day}>
            <h3 className="bg-muted/30 text-muted-foreground px-4 py-2 text-xs font-semibold uppercase">{day}</h3>
            <ul className="divide-y">
              {items.map((e, i) => (
                <li key={i} className="px-4 py-2 text-sm">
                  <span
                    className={`mr-2 inline-block h-2 w-2 rounded-full ${
                      e.type === "Warning" ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    aria-hidden
                  />
                  <span className="font-mono">{e.reason}</span>
                  <span className="text-muted-foreground ml-2">
                    {e.involvedObject?.kind}/{e.involvedObject?.name}
                  </span>
                  <span className="ml-2">{e.message}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
    </div>
  );
}
