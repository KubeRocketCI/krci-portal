import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Tooltip, Chip } from "@mui/material";
import { useTheme } from "@mui/material/styles";

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
  const theme = useTheme();

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
        style={{
          background: theme.palette.primary.main,
          width: 8,
          height: 8,
          border: `2px solid ${theme.palette.background.paper}`,
        }}
      />

      <Tooltip title={tooltipContent} arrow placement="top">
        <div
          className={`pointer-events-auto relative flex h-full w-full cursor-default flex-col items-center justify-center rounded-lg border-2 p-6 transition-all ${
            data.isFinally || data.isIsolated ? "border-dashed" : "border-border hover:border-primary hover:shadow-lg"
          }`}
          style={{
            backgroundColor: theme.palette.background.paper,
            ...(data.isFinally || data.isIsolated ? { borderColor: theme.palette.grey[400] } : {}),
          }}
        >
          {/* Task type indicators */}
          {data.isFinally && (
            <Chip
              label="Finally"
              size="small"
              sx={{
                position: "absolute",
                top: -8,
                right: -8,
                fontSize: "0.6rem",
                height: 16,
                backgroundColor: theme.palette.grey[300],
                color: theme.palette.grey[700],
              }}
            />
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
        style={{
          background: theme.palette.primary.main,
          width: 8,
          height: 8,
          border: `2px solid ${theme.palette.background.paper}`,
        }}
      />
    </>
  );
};
