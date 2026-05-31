import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";

/**
 * Scrollable, count-badged `key: value` list for labels/annotations.
 * Promoted from the Pod detail sidebar's local `MetadataListCard`.
 */
export function MetadataCard({ title, entries }: { title: string; entries: Record<string, string | undefined> }) {
  const items = Object.entries(entries).filter((entry): entry is [string, string] => entry[1] !== undefined);

  return (
    <Card>
      <CardHeader className="p-3 pb-1">
        <CardTitle className="flex items-baseline justify-between text-sm font-semibold">
          <span>{title}</span>
          <span className="text-muted-foreground text-xs">{items.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1">
        {items.length === 0 ? (
          <div className="text-muted-foreground text-xs">—</div>
        ) : (
          <ul className="max-h-56 space-y-1 overflow-y-auto pr-1 font-mono text-xs">
            {items.map(([k, v]) => (
              <li key={k} className="break-all">
                <span className="text-muted-foreground">{k}:</span> <span>{v}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
