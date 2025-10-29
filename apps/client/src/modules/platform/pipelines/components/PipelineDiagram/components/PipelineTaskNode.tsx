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
      <p className="text-sm font-semibold">
        {displayName}
      </p>
      {data.description && (
        <p className="text-sm mt-1">
          {data.description}
        </p>
      )}
      {data.taskRef?.name && (
        <span className="text-xs mt-1 block">
          Task: {data.taskRef.name}
        </span>
      )}
      {data.isFinally && (
        <span className="text-xs mt-1 block italic">
          Finally task - runs after all main tasks complete
        </span>
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
          className={`w-full h-full rounded-lg p-6 flex flex-col justify-center items-center cursor-default relative pointer-events-auto transition-all border-2 ${
            data.isFinally || data.isIsolated
              ? "border-dashed"
              : "border-border hover:border-primary hover:shadow-lg"
          }`}
          style={{
            backgroundColor: theme.palette.background.paper,
            ...(data.isFinally || data.isIsolated
              ? { borderColor: theme.palette.grey[400] }
              : {}),
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

          <p className="text-sm font-semibold text-center leading-tight break-word text-foreground">
            {truncatedName}
          </p>

          {data.taskRef?.name && (
            <span
              className="text-xs text-muted-foreground text-center mt-1 leading-none"
            >
              {data.taskRef.name}
            </span>
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
