import { Handle, Position } from "@xyflow/react";
import { Webhook, EyeOff } from "lucide-react";
import { EventListener } from "@my-project/shared";
import { Badge } from "@/core/components/ui/badge";
import { Tooltip } from "@/core/components/ui/tooltip";
import { cn } from "@/core/utils/classname";
import { TriggerSelection } from "@/modules/platform/tekton/hooks/useEventListenerTopology";
import { describeSelectionGaps } from "../utils/selectionGaps";
import { NODE_KIND_TAILWIND, NODE_KIND } from "../constants";

const pluralize = (count: number, noun: string) => `${count} ${noun}${count === 1 ? "" : "s"}`;

export const EventListenerNode = ({
  data,
}: {
  data: {
    eventListener: EventListener;
    ready: boolean;
    address: string | null;
    triggerSelection: TriggerSelection;
  };
}) => {
  const { listedCount, labelMatchedCount, gaps } = data.triggerSelection;

  return (
    <div
      className={cn(
        "border-border rounded-lg border p-3 text-sm shadow-sm",
        NODE_KIND_TAILWIND[NODE_KIND.EVENT_LISTENER]
      )}
    >
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="mb-1 flex items-center gap-2 font-medium">
        <Webhook size={16} />
        <span>{data.eventListener.metadata.name}</span>
        {data.ready ? <Badge variant="success">Ready</Badge> : <Badge variant="destructive">Degraded</Badge>}
        {gaps.length > 0 && (
          <Tooltip title={describeSelectionGaps(gaps).join(" ")}>
            <Badge variant="warning" tabIndex={0}>
              <EyeOff size={10} />
              partial view
            </Badge>
          </Tooltip>
        )}
      </div>
      {data.address && <div className="text-muted-foreground font-mono text-xs">{data.address}</div>}
      <div className="text-muted-foreground mt-1 text-xs">
        {pluralize(listedCount, "trigger")}
        {labelMatchedCount > 0 && ` · ${labelMatchedCount} via label`}
      </div>
    </div>
  );
};
