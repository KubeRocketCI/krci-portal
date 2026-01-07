import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Badge } from "@/core/components/ui/badge";
import { Tooltip } from "@/core/components/ui/tooltip";
import { StatusIcon } from "@/core/components/StatusIcon";
import { getTaskRunStatusIcon } from "@/k8s/api/groups/Tekton/TaskRun/utils";
import { getStepStatusIcon } from "@/k8s/api/groups/Tekton/TaskRun/utils/getStepStatusIcon";
import { getApprovalTaskStatusIcon } from "@/k8s/api/groups/KRCI/ApprovalTask/utils";
import { humanize } from "@/core/utils/date-humanize";
import { PipelineRunTaskNodeData } from "../hooks/usePipelineRunGraphData";
import { getTaskRunStepStatus } from "@my-project/shared";
import { ListOrdered, Timer } from "lucide-react";

export const PipelineRunTaskNode: React.FC<{
  data: PipelineRunTaskNodeData;
  sourcePosition?: Position;
  targetPosition?: Position;
}> = ({ data, sourcePosition, targetPosition }) => {
  const displayName = data.name;

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
    <div className="space-y-2">
      {/* Task name + status in one row */}
      <div className="my-2 mb-4 flex items-center gap-4">
        <p className="text-sm font-semibold break-all">{displayName}</p>
        <div className="flex items-center gap-2">
          {statusData.component && (
            <StatusIcon
              Icon={statusData.component}
              isSpinning={statusData.isSpinning}
              color={statusData.color}
              width={14}
            />
          )}
          <span className="text-xs font-medium">{statusText}</span>
        </div>
      </div>

      {data.task?.spec?.description && (
        <div className="mb-4 flex items-start gap-2">
          <span className="text-background/80 text-xs">Description:</span>
          <span className="text-xs">{data.task.spec.description}</span>
        </div>
      )}

      {duration && (
        <div className="flex items-center gap-2">
          <Timer className="text-muted-foreground size-3.5" />
          <span className="text-background/80 text-xs">Duration:</span>
          <span className="text-xs font-medium">{duration}</span>
        </div>
      )}

      {/* Steps with individual status icons */}
      {data.taskRun?.status?.steps && data.taskRun.status.steps.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ListOrdered className="text-muted-foreground size-3.5" />
            <span className="text-background/80 text-xs">Steps:</span>
          </div>
          <div className="space-y-0.5 pl-5">
            {data.taskRun.status.steps.map((step) => {
              const stepStatus = getTaskRunStepStatus(step);
              const stepStatusIcon = getStepStatusIcon(step);

              return (
                <div key={step.name} className="flex items-center gap-1.5">
                  <StatusIcon
                    Icon={stepStatusIcon.component}
                    color={stepStatusIcon.color}
                    isSpinning={stepStatusIcon.isSpinning}
                    width={12}
                    Title={`Status: ${stepStatus.status}. Reason: ${stepStatus.reason}`}
                  />
                  <span className="text-[0.7rem]">{step.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {data.isFinally && (
        <span className="text-muted-foreground mt-1 block text-[0.7rem] italic">
          Finally task - runs after all main tasks complete
        </span>
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
          className="bg-background relative flex h-16 w-48 cursor-default flex-col items-center justify-center rounded-md p-6"
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
            <p className="text-foreground line-clamp-1 text-sm leading-tight font-semibold break-all"> {displayName}</p>
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
