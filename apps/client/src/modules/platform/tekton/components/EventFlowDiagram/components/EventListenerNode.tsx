import { Handle, Position } from "@xyflow/react";
import { Webhook } from "lucide-react";
import { EventListener } from "@my-project/shared";
import { Badge } from "@/core/components/ui/badge";
import { cn } from "@/core/utils/classname";
import { NODE_KIND_TAILWIND, NODE_KIND } from "../constants";

export const EventListenerNode = ({
  data,
}: {
  data: {
    eventListener: EventListener;
    ready: boolean;
    address: string | null;
    triggerCount: number;
  };
}) => (
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
    </div>
    {data.address && <div className="text-muted-foreground font-mono text-xs">{data.address}</div>}
    <div className="text-muted-foreground mt-1 text-xs">
      {data.triggerCount} trigger{data.triggerCount === 1 ? "" : "s"}
    </div>
  </div>
);
