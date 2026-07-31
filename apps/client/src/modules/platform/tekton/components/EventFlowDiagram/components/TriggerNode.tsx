import { Handle, Position } from "@xyflow/react";
import { Zap, AlertTriangle, Lock, Tag } from "lucide-react";
import { Trigger } from "@my-project/shared";
import { cn } from "@/core/utils/classname";
import { Badge } from "@/core/components/ui/badge";
import { Tooltip } from "@/core/components/ui/tooltip";
import { NODE_KIND_TAILWIND, NODE_KIND } from "../constants";
import { ResolutionStatusBadge } from "./ResolutionStatusBadge";
import { ResolutionStatus } from "@/modules/platform/tekton/hooks/useEventListenerTopology";

const iconFor = (status: ResolutionStatus) => {
  if (status === "resolved") return <Zap size={16} />;
  if (status === "restricted") return <Lock size={16} className="text-muted-foreground" />;
  return <AlertTriangle size={16} className="text-destructive" />;
};

const captionFor = (status: ResolutionStatus) => {
  if (status === "resolved") return "external Trigger CR";
  if (status === "restricted") return "Trigger CR not visible (RBAC or missing CRD)";
  return "missing Trigger CR";
};

export const TriggerNode = ({
  data,
}: {
  data: {
    triggerRef: string;
    resolved: Trigger | null;
    status: ResolutionStatus;
    namespace: string;
    viaTerms?: string[];
    firesTwice?: boolean;
  };
}) => (
  <div
    className={cn(
      "border-border rounded-lg border p-3 text-sm shadow-sm",
      NODE_KIND_TAILWIND[NODE_KIND.TRIGGER],
      data.firesTwice && "border-destructive"
    )}
  >
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
    <div className="flex items-center gap-2 font-medium">
      {iconFor(data.status)}
      <span>{data.triggerRef}</span>
      <ResolutionStatusBadge status={data.status} resourceLabel="Trigger" />
      {data.viaTerms && (
        <Tooltip title={`Matched via labelSelector: ${data.viaTerms.join(", ") || "(no terms)"}`}>
          <Badge variant="secondary" tabIndex={0}>
            <Tag size={10} />
            via label
          </Badge>
        </Tooltip>
      )}
      {data.firesTwice && (
        <Tooltip title="This Trigger is both listed in spec.triggers and matched by spec.labelSelector — it fires twice per event.">
          <Badge variant="destructive" tabIndex={0}>
            <AlertTriangle size={10} />
            fires twice
          </Badge>
        </Tooltip>
      )}
    </div>
    <div className="text-muted-foreground mt-1 text-xs">{captionFor(data.status)}</div>
  </div>
);
