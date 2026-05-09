import { Handle, Position } from "@xyflow/react";
import { Link } from "@tanstack/react-router";
import { useShallow } from "zustand/react/shallow";
import { AlertTriangle, Activity } from "lucide-react";
import { ENTITY_ICON } from "@/k8s/constants/entity-icons";
import { cn } from "@/core/utils/classname";
import { useClusterStore } from "@/k8s/store";
import { PipelineRun, getPipelineRunStatus } from "@my-project/shared";
import { PipelineRefShape } from "@/modules/platform/tekton/hooks/useEventListenerTopology";
import { routePipelineDetails } from "@/modules/platform/tekton/pages/pipeline-details/route";
import { routePipelineRunDetails } from "@/modules/platform/tekton/pages/pipelinerun-details/route";
import { NODE_KIND_TAILWIND, NODE_KIND } from "../constants";

export const PipelineNode = ({
  data,
}: {
  data: {
    pipelineRef: PipelineRefShape;
    latestPipelineRun: PipelineRun | null;
    namespace: string;
  };
}) => {
  const { clusterName } = useClusterStore(useShallow((s) => ({ clusterName: s.clusterName })));
  const { pipelineRef, latestPipelineRun, namespace } = data;
  const PipelineIcon = ENTITY_ICON.pipeline;

  return (
    <div
      className={cn(
        "border-border rounded-lg border p-3 text-sm shadow-sm",
        pipelineRef.kind === "unknown"
          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
          : NODE_KIND_TAILWIND[NODE_KIND.PIPELINE]
      )}
    >
      <Handle type="target" position={Position.Left} />
      <div className="flex items-center gap-2 font-medium">
        {pipelineRef.kind === "unknown" ? <AlertTriangle size={16} /> : <PipelineIcon size={16} />}
        {pipelineRef.kind === "literal" && (
          <Link
            to={routePipelineDetails.fullPath}
            params={{ clusterName, namespace, name: pipelineRef.pipelineName }}
            className="hover:underline"
          >
            {pipelineRef.pipelineName}
          </Link>
        )}
        {pipelineRef.kind === "templated" && <span>Pipeline (dynamic)</span>}
        {pipelineRef.kind === "unknown" && <span>Pipeline (unknown)</span>}
      </div>
      {pipelineRef.kind === "templated" && (
        <div className="text-muted-foreground mt-1 font-mono text-xs">{pipelineRef.raw}</div>
      )}
      {latestPipelineRun && (
        <div className="mt-1 flex items-center gap-1 text-xs">
          <Activity size={12} />
          <span className="text-muted-foreground">latest run:</span>
          <Link
            to={routePipelineRunDetails.fullPath}
            params={{ clusterName, namespace, name: latestPipelineRun.metadata.name }}
            className="font-medium hover:underline"
          >
            {getPipelineRunStatus(latestPipelineRun).reason}
          </Link>
        </div>
      )}
    </div>
  );
};
