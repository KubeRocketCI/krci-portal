import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Box, Typography, Tooltip, Chip } from "@mui/material";
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
    <Box>
      <Typography variant="subtitle2" fontWeight={600}>
        {displayName}
      </Typography>
      {data.description && (
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          {data.description}
        </Typography>
      )}
      {data.taskRef?.name && (
        <Typography variant="caption" sx={{ mt: 0.5, display: "block" }}>
          Task: {data.taskRef.name}
        </Typography>
      )}
      {data.isFinally && (
        <Typography variant="caption" sx={{ mt: 0.5, display: "block", fontStyle: "italic" }}>
          Finally task - runs after all main tasks complete
        </Typography>
      )}
    </Box>
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
        <Box
          sx={{
            width: "100%",
            height: "100%",
            backgroundColor: theme.palette.background.paper,
            border: `2px solid ${theme.palette.divider}`,
            borderRadius: 2,
            padding: 1.5,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            cursor: "default",
            position: "relative",
            pointerEvents: "auto", // Ensure hover events work
            "&:hover": {
              borderColor: theme.palette.primary.main,
              boxShadow: theme.shadows[4],
            },
            ...((data.isFinally || data.isIsolated) && {
              borderColor: theme.palette.grey[400],
              borderStyle: "dashed",
            }),
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

          <Typography
            variant="body2"
            fontWeight={600}
            textAlign="center"
            sx={{
              color: theme.palette.text.primary,
              lineHeight: 1.2,
              wordBreak: "break-word",
            }}
          >
            {truncatedName}
          </Typography>

          {data.taskRef?.name && (
            <Typography
              variant="caption"
              color="text.secondary"
              textAlign="center"
              sx={{
                mt: 0.5,
                fontSize: "0.65rem",
                lineHeight: 1,
              }}
            >
              {data.taskRef.name}
            </Typography>
          )}
        </Box>
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
