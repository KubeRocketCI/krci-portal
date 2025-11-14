import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Badge } from "@/core/components/ui/badge";
import { Tooltip } from "@/core/components/ui/tooltip";

export interface PipelineTaskNodeData {
  name: string;
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

  const displayName = data.displayName || data.name;
  const truncatedName = displayName.length > 20 ? `${displayName.slice(0, 17)}...` : displayName;

  const tooltipContent = (
    <div>
      <p className="text-sm font-semibold">{displayName}</p>
      {data.description && <p className="mt-1 text-sm">{data.description}</p>}
      {data.taskRef?.name && <span className="mt-1 block text-xs">Task: {data.taskRef.name}</span>}
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
        className="bg-primary w-2 h-2 border-2 border-background"
      />

      <Tooltip title={tooltipContent} placement="top">
        <div
          className={`pointer-events-auto relative flex h-full w-full cursor-default flex-col items-center justify-center rounded-lg border-2 p-6 bg-background ${
            data.isFinally || data.isIsolated
              ? "border-dashed border-muted-foreground"
              : "border-border hover:border-primary hover:shadow-lg"
          }`}
        >
          {/* Task type indicators */}
          {data.isFinally && (
            <Badge variant="secondary" className="absolute -top-2 -right-2 h-4 bg-gray-300 text-[0.6rem] text-gray-700">
              Finally
            </Badge>
          )}

          <p className="break-word text-foreground text-center text-sm leading-tight font-semibold">{truncatedName}</p>

          {data.taskRef?.name && (
            <span className="text-muted-foreground mt-1 text-center text-xs leading-none">{data.taskRef.name}</span>
          )}
        </div>
      </Tooltip>

      {/* Output handle */}
      <Handle
        type="source"
        position={sourcePosition || Position.Bottom}
        className="bg-primary w-2 h-2 border-2 border-background"
      />
    </>
  );
};
