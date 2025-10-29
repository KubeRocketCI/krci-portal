import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Tooltip, Chip } from "@mui/material";
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
    <div>
      <p className="text-sm font-semibold">
        {displayName}
      </p>
      <p className="text-sm mt-1">
        Status: {statusText}
      </p>
      {duration && (
        <p className="text-sm mt-1">
          Duration: {duration}
        </p>
      )}
      {data.task?.spec?.description && (
        <p className="text-sm mt-1">
          {data.task.spec.description}
        </p>
      )}
      {data.taskRun?.status?.steps && data.taskRun.status.steps.length > 0 && (
        <span className="text-xs mt-1 block">
          Steps: {data.taskRun.status.steps.map((step) => step.name).join(", ")}
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
          background: statusData.color,
          width: 8,
          height: 8,
          border: `2px solid ${theme.palette.background.paper}`,
        }}
      />

      <Tooltip title={tooltipContent} arrow placement="top">
        <div
          className="w-[180px] h-[60px] bg-background rounded-md p-6 flex flex-col justify-center items-center cursor-default relative"
          style={{
            border: `2px solid ${statusData.color}`,
            borderStyle: data.isFinally || data.isIsolated ? "dashed" : "solid",
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
          <div className="flex items-center gap-4 mb-2">
            {statusData.component && (
              <StatusIcon
                Icon={statusData.component}
                color={statusData.color}
                isSpinning={statusData.isSpinning}
                width={16}
                Title={statusText}
              />
            )}
            <p className="text-sm font-semibold text-center text-foreground leading-tight break-word">
              {truncatedName}
            </p>
          </div>

          {/* Task reference */}
          {data.pipelineTask?.taskRef?.name && (
            <span className="text-xs text-muted-foreground text-center leading-none">
              {data.pipelineTask.taskRef.name}
            </span>
          )}
        </div>
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
