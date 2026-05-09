import { Handle, Position } from "@xyflow/react";
import { Link2 } from "lucide-react";
import { Badge } from "@/core/components/ui/badge";
import { cn } from "@/core/utils/classname";
import { ResolvedBindingRef } from "@/modules/platform/tekton/hooks/useEventListenerTopology";
import { NODE_KIND_TAILWIND, NODE_KIND } from "../constants";
import { ResolutionStatusBadge } from "./ResolutionStatusBadge";

export const TriggerBindingNode = ({ data }: { data: { binding: ResolvedBindingRef; namespace: string } }) => {
  const { ref, kind, resolved, status } = data.binding;
  const params = resolved?.spec?.params ?? [];
  const isCluster = kind === "ClusterTriggerBinding";
  return (
    <div
      className={cn(
        "rounded-lg border p-3 text-sm shadow-sm",
        isCluster ? "border-border border-dashed" : "border-border",
        NODE_KIND_TAILWIND[NODE_KIND.TRIGGER_BINDING]
      )}
    >
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex items-center gap-2 font-medium">
        <Link2 size={16} />
        <span>{ref}</span>
        <Badge variant="secondary" className="text-xs">
          {params.length} param{params.length === 1 ? "" : "s"}
        </Badge>
        {/* CTB has its own descriptive copy below; the generic status badge
            would be redundant and confusing. */}
        {!isCluster && <ResolutionStatusBadge status={status} resourceLabel="TriggerBinding" />}
      </div>
      {isCluster && <div className="text-muted-foreground mt-1 text-xs">(unresolved — ClusterTriggerBinding)</div>}
    </div>
  );
};
