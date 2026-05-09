import { Handle, Position } from "@xyflow/react";
import { Funnel, KeyRound } from "lucide-react";
import { Badge } from "@/core/components/ui/badge";
import { Tooltip } from "@/core/components/ui/tooltip";
import { cn } from "@/core/utils/classname";
import { ResolvedInterceptorRef } from "@/modules/platform/tekton/hooks/useEventListenerTopology";
import { NODE_KIND_TAILWIND, NODE_KIND } from "../constants";
import { ResolutionStatusBadge } from "./ResolutionStatusBadge";

const renderParam = (name: string, value: unknown) => {
  if (name === "filter" && typeof value === "string") {
    return (
      <Tooltip title={value}>
        <code className="inline-block max-w-[180px] truncate text-xs">{value}</code>
      </Tooltip>
    );
  }
  if (name === "eventTypes" && Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((v) => (
          <Badge key={String(v)} variant="secondary" className="text-xs">
            {String(v)}
          </Badge>
        ))}
      </div>
    );
  }
  if (name === "secretRef" && typeof value === "object" && value !== null) {
    const v = value as { secretName?: string; secretKey?: string };
    return (
      <span className="flex items-center gap-1 text-xs">
        <KeyRound size={12} />
        {v.secretName}/{v.secretKey}
      </span>
    );
  }
  return (
    <pre className="text-xs break-words whitespace-pre-wrap">
      {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
    </pre>
  );
};

export const InterceptorNode = ({ data }: { data: { interceptor: ResolvedInterceptorRef; namespace: string } }) => {
  const { ref, params, status } = data.interceptor;
  return (
    <div
      className={cn("border-border rounded-lg border p-3 text-sm shadow-sm", NODE_KIND_TAILWIND[NODE_KIND.INTERCEPTOR])}
    >
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="mb-1 flex items-center gap-2 font-medium">
        <Funnel size={16} />
        <span>{ref.name}</span>
        <Badge variant="secondary" className="text-xs">
          {ref.kind === "ClusterInterceptor" ? "Cluster" : "Namespaced"}
        </Badge>
        <ResolutionStatusBadge
          status={status}
          resourceLabel={ref.kind === "ClusterInterceptor" ? "ClusterInterceptor" : "Interceptor"}
        />
      </div>
      <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-xs">
        {params.map((p, idx) => (
          <div key={`${p.name}-${idx}`} className="contents">
            <div className="text-muted-foreground font-mono">{p.name}</div>
            <div className="min-w-0">{renderParam(p.name, p.value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
