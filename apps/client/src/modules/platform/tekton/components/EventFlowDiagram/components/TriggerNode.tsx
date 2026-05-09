import { Handle, Position } from "@xyflow/react";
import { Zap, AlertTriangle, Lock } from "lucide-react";
import { Trigger } from "@my-project/shared";
import { cn } from "@/core/utils/classname";
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
  };
}) => (
  <div className={cn("border-border rounded-lg border p-3 text-sm shadow-sm", NODE_KIND_TAILWIND[NODE_KIND.TRIGGER])}>
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
    <div className="flex items-center gap-2 font-medium">
      {iconFor(data.status)}
      <span>{data.triggerRef}</span>
      <ResolutionStatusBadge status={data.status} resourceLabel="Trigger" />
    </div>
    <div className="text-muted-foreground mt-1 text-xs">{captionFor(data.status)}</div>
  </div>
);
