import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Badge } from "@/core/components/ui/badge";
import { Tooltip } from "@/core/components/ui/tooltip";
import { Link } from "@tanstack/react-router";
import { Button } from "@/core/components/ui/button";
import { routeTaskDetails } from "@/modules/platform/tekton/pages/task-details/route";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";

export interface PipelineTaskNodeData {
  name: string;
  namespace: string;
  description?: string;
  displayName?: string;
  taskRef?: {
    name: string;
  };
  isFinally?: boolean;
  isIsolated?: boolean;
}

export const PipelineTaskNode: React.FC<{
  data: PipelineTaskNodeData;
  sourcePosition?: Position;
  targetPosition?: Position;
}> = ({ data, sourcePosition, targetPosition }) => {
  const { clusterName } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
    }))
  );

  const displayName = data.displayName || data.name;
  const truncatedName = displayName.length > 20 ? `${displayName.slice(0, 17)}...` : displayName;

  const taskRefName = data.taskRef?.name;
  const hasTaskRef = !!taskRefName;

  const tooltipContent = (
    <div>
      <p className="text-sm font-semibold">{displayName}</p>
      {data.description && <p className="mt-1 text-sm">{data.description}</p>}
      {hasTaskRef && <span className="mt-1 block text-xs">Task: {taskRefName}</span>}
      {data.isFinally && (
        <span className="mt-1 block text-xs italic">Finally task - runs after all main tasks complete</span>
      )}
    </div>
  );

  return (
    <>
      {/* Input handle */}
      <Handle
        type="target"
        position={targetPosition || Position.Top}
        className="bg-primary border-background h-2 w-2 border-2"
      />

      <Tooltip title={tooltipContent} placement="top">
        <div
          className={`bg-background pointer-events-auto relative flex h-full w-full cursor-default flex-col items-center justify-center rounded-lg border-2 p-6 ${
            data.isFinally || data.isIsolated
              ? "border-muted-foreground border-dashed"
              : "border-border hover:border-primary hover:shadow-lg"
          }`}
        >
          {/* Task type indicators */}
          {data.isFinally && (
            <Badge variant="neutral" className="absolute -top-2 -right-2 h-4 rounded text-[0.6rem]">
              Finally
            </Badge>
          )}

          <p className="break-word text-foreground text-center text-sm leading-tight font-semibold">{truncatedName}</p>

          {hasTaskRef && (
            <Button variant="link" asChild className="h-auto p-0">
              <Link
                to={routeTaskDetails.fullPath}
                params={{
                  clusterName,
                  namespace: data.namespace,
                  name: taskRefName!,
                }}
                className="text-muted-foreground hover:text-primary mt-1 text-center text-xs leading-none"
              >
                {taskRefName}
              </Link>
            </Button>
          )}
        </div>
      </Tooltip>

      {/* Output handle */}
      <Handle
        type="source"
        position={sourcePosition || Position.Bottom}
        className="bg-primary border-background h-2 w-2 border-2"
      />
    </>
  );
};
