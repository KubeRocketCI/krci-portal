import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Box, Typography, Tooltip, Chip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { StatusIcon } from "@/core/components/StatusIcon";
import { getTaskRunStatusIcon } from "@/k8s/api/groups/Tekton/TaskRun/utils";
import { getApprovalTaskStatusIcon } from "@/k8s/api/groups/KRCI/ApprovalTask/utils";
import { humanize } from "@/core/utils/date-humanize";
import { PipelineRunTaskNodeData } from "../hooks/usePipelineRunGraphData";

export const PipelineRunTaskNode: React.FC<{
  data: PipelineRunTaskNodeData;
  sourcePosition?: Position;
  targetPosition?: Position;
}> = ({ data, sourcePosition, targetPosition }) => {
  const theme = useTheme();

  const displayName = data.name;
  const truncatedName = displayName.length > 20 ? `${displayName.slice(0, 17)}...` : displayName;

  // Get status icon and color
  const getStatusData = () => {
    if (data.approvalTask) {
      return getApprovalTaskStatusIcon(data.approvalTask);
    }
    if (data.taskRun) {
      return getTaskRunStatusIcon(data.taskRun);
    }
    return {
      component: null,
      color: theme.palette.grey[400],
    };
  };

  const statusData = getStatusData();

  // Get duration
  const getDuration = () => {
    if (!data.taskRun?.status?.startTime) return null;

    const startTime = new Date(data.taskRun.status.startTime).getTime();
    const endTime = data.taskRun.status?.completionTime
      ? new Date(data.taskRun.status.completionTime).getTime()
      : new Date().getTime();

    return humanize(endTime - startTime, {
      language: "en-mini",
      spacer: "",
      delimiter: " ",
      fallbacks: ["en"],
      largest: 2,
      round: true,
      units: ["d", "h", "m", "s"],
    });
  };

  // Get status text
  const getStatusText = () => {
    if (data.approvalTask) {
      return data.approvalTask.spec.action || "Unknown";
    }
    if (data.taskRun?.status?.conditions?.[0]) {
      const condition = data.taskRun.status.conditions[0];
      return condition.reason || condition.status || "Unknown";
    }
    return "Not Started";
  };

  const duration = getDuration();
  const statusText = getStatusText();

  const tooltipContent = (
    <Box>
      <Typography variant="subtitle2" fontWeight={600}>
        {displayName}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.5 }}>
        Status: {statusText}
      </Typography>
      {duration && (
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          Duration: {duration}
        </Typography>
      )}
      {data.task?.spec?.description && (
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          {data.task.spec.description}
        </Typography>
      )}
      {data.taskRun?.status?.steps && data.taskRun.status.steps.length > 0 && (
        <Typography variant="caption" sx={{ mt: 0.5, display: "block" }}>
          Steps: {data.taskRun.status.steps.map((step) => step.name).join(", ")}
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
          background: statusData.color,
          width: 8,
          height: 8,
          border: `2px solid ${theme.palette.background.paper}`,
        }}
      />

      <Tooltip title={tooltipContent} arrow placement="top">
        <Box
          sx={{
            width: 180,
            height: 60,
            backgroundColor: theme.palette.background.paper,
            border: `2px solid ${statusData.color}`,
            borderRadius: 2,
            padding: 1.5,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            cursor: "default",
            position: "relative",
            pointerEvents: "auto",
            "&:hover": {
              borderColor: statusData.color,
              boxShadow: theme.shadows[4],
            },
            ...((data.isFinally || data.isIsolated) && {
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

          {/* Status icon and task name */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            {statusData.component && (
              <StatusIcon
                Icon={statusData.component}
                color={statusData.color}
                isSpinning={statusData.isSpinning}
                width={16}
                Title={statusText}
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
          </Box>

          {/* Task reference */}
          {data.pipelineTask?.taskRef?.name && (
            <Typography
              variant="caption"
              color="text.secondary"
              textAlign="center"
              sx={{
                fontSize: "0.65rem",
                lineHeight: 1,
              }}
            >
              {data.pipelineTask.taskRef.name}
            </Typography>
          )}
        </Box>
      </Tooltip>

      {/* Output handle */}
      <Handle
        type="source"
        position={sourcePosition || Position.Bottom}
        style={{
          background: statusData.color,
          width: 8,
          height: 8,
          border: `2px solid ${theme.palette.background.paper}`,
        }}
      />
    </>
  );
};
