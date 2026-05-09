import { Handle, Position } from "@xyflow/react";
import { FileCode } from "lucide-react";
import { Badge } from "@/core/components/ui/badge";
import { cn } from "@/core/utils/classname";
import { ResolvedTriggerNode } from "@/modules/platform/tekton/hooks/useEventListenerTopology";
import { NODE_KIND_TAILWIND, NODE_KIND } from "../constants";
import { ResolutionStatusBadge } from "./ResolutionStatusBadge";

export const TriggerTemplateNode = ({
  data,
}: {
  data: { template: ResolvedTriggerNode["template"]; namespace: string };
}) => {
  const { ref, pipelineRef, status } = data.template;
  return (
    <div
      className={cn(
        "border-border rounded-lg border p-3 text-sm shadow-sm",
        NODE_KIND_TAILWIND[NODE_KIND.TRIGGER_TEMPLATE]
      )}
    >
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex items-center gap-2 font-medium">
        <FileCode size={16} />
        <span>{ref || "(no template)"}</span>
        <ResolutionStatusBadge status={status} resourceLabel="TriggerTemplate" />
      </div>
      <div className="text-muted-foreground mt-1 text-xs">
        {pipelineRef.kind === "literal" && <>creates: PipelineRun → {pipelineRef.pipelineName}</>}
        {pipelineRef.kind === "templated" && (
          <>
            creates: PipelineRun → <code>{pipelineRef.raw}</code>
            {pipelineRef.sourceParam && (
              <Badge variant="secondary" className="ml-1 text-xs">
                ← param: {pipelineRef.sourceParam}
              </Badge>
            )}
          </>
        )}
        {pipelineRef.kind === "unknown" && <>pipelineRef: unknown</>}
      </div>
    </div>
  );
};
