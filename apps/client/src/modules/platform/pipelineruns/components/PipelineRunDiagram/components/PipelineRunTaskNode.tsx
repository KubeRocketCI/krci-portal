import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Badge } from "@/core/components/ui/badge";
import { Tooltip } from "@/core/components/ui/tooltip";
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
      color: "#9ca3af", // gray-400 equivalent
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
      <p className="text-sm font-semibold">{displayName}</p>
      <p className="mt-1 text-sm">Status: {statusText}</p>
      {duration && <p className="mt-1 text-sm">Duration: {duration}</p>}
      {data.task?.spec?.description && <p className="mt-1 text-sm">{data.task.spec.description}</p>}
      {data.taskRun?.status?.steps && data.taskRun.status.steps.length > 0 && (
        <span className="mt-1 block text-xs">
          Steps: {data.taskRun.status.steps.map((step) => step.name).join(", ")}
        </span>
      )}
      {data.isFinally && (
        <span className="mt-1 block text-xs italic">Finally task - runs after all main tasks complete</span>
      )}
    </div>
  );

  return (
    <>
      <Handle
        type="target"
        position={targetPosition || Position.Top}
        className="border-background h-2 w-2 border-2"
        style={{
          background: statusData.color,
        }}
      />

      <Tooltip title={tooltipContent} placement="top">
        <div
          className="bg-background relative flex h-[60px] w-[180px] cursor-default flex-col items-center justify-center rounded-md p-6"
          style={{
            border: `2px solid ${statusData.color}`,
            borderStyle: data.isFinally || data.isIsolated ? "dashed" : "solid",
          }}
        >
          {/* Task type indicators */}
          {data.isFinally && (
            <Badge variant="secondary" className="absolute -top-2 -right-2 h-4 bg-gray-300 text-[0.6rem] text-gray-700">
              Finally
            </Badge>
          )}

          {/* Status icon and task name */}
          <div className="mb-2 flex items-center gap-4">
            {statusData.component && (
              <StatusIcon
                Icon={statusData.component}
                color={statusData.color}
                isSpinning={statusData.isSpinning}
                width={16}
                Title={statusText}
              />
            )}
            <p className="text-foreground break-word text-center text-sm leading-tight font-semibold">
              {truncatedName}
            </p>
          </div>

          {/* Task reference */}
          {data.pipelineTask?.taskRef?.name && (
            <span className="text-muted-foreground text-center text-xs leading-none">
              {data.pipelineTask.taskRef.name}
            </span>
          )}
        </div>
      </Tooltip>

      {/* Output handle */}
      <Handle
        type="source"
        position={sourcePosition || Position.Bottom}
        className="border-background h-2 w-2 border-2"
        style={{
          background: statusData.color,
        }}
      />
    </>
  );
};
