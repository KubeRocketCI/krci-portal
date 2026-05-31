import { Badge } from "@/core/components/ui/badge";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";

export interface ContainerImageInfo {
  name: string;
  image?: string;
  imagePullPolicy?: string;
}

/**
 * Renders a workload's pod-template containers as `name | image | pullPolicy` rows.
 */
export function ContainerImagesList({ containers }: { containers: ContainerImageInfo[] }) {
  if (!containers || containers.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <ul className="space-y-1">
      {containers.map((c, i) => (
        <li key={`${c.name}-${i}`} className="flex min-w-0 items-center gap-2 text-xs">
          <Badge variant="outline" className="shrink-0 font-mono">
            {c.name}
          </Badge>
          <span className="text-muted-foreground min-w-0 flex-1 truncate font-mono">
            <TextWithTooltip text={c.image ?? "—"} />
          </span>
          {c.imagePullPolicy && <span className="text-muted-foreground shrink-0">{c.imagePullPolicy}</span>}
        </li>
      ))}
    </ul>
  );
}
