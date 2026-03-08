import { StatusIcon } from "@/core/components/StatusIcon";
import { getStepStatusIcon } from "@/k8s/api/groups/Tekton/TaskRun/utils/getStepStatusIcon";
import { ApprovalTask, approvalTaskAction, getTaskRunStepStatus, Task, TaskRun } from "@my-project/shared";
import React from "react";
import { cn } from "@/core/utils/classname";
import { formatDuration } from "@/core/utils/date-humanize";
import { approvalTaskBackground, getApprovalTaskOrTaskRunStatusIcon, updateUnexecutedSteps } from "./utils";
import { ChevronDown, ChevronRight } from "lucide-react";

export interface MenuAccordionBaseProps {
  taskRunName: string;
  pipelineRunTasksByNameMap: Map<
    string,
    {
      approvalTask?: ApprovalTask;
      taskRun?: TaskRun;
      task?: Task;
    }
  >;
  queryParamTaskRun: string | undefined;
  queryParamStep: string | undefined;
  onNavigate: (taskRunName: string, taskRunStepName?: string) => void;
}

export function MenuAccordionView({
  taskRunName,
  pipelineRunTasksByNameMap,
  queryParamTaskRun,
  queryParamStep,
  onNavigate,
}: MenuAccordionBaseProps) {
  const pipelineRunTaskData = pipelineRunTasksByNameMap.get(taskRunName);

  const approvalTask = pipelineRunTaskData?.approvalTask;
  const taskRun = pipelineRunTaskData?.taskRun;
  const task = pipelineRunTaskData?.task;

  const taskStatusIcon = getApprovalTaskOrTaskRunStatusIcon(approvalTask, taskRun);

  const taskSteps = updateUnexecutedSteps(
    taskRun?.status?.steps ?? task?.spec?.steps ?? taskRun?.status?.taskSpec?.steps
  );
  const isExpanded = queryParamTaskRun === taskRunName;
  const isTaskActive = queryParamTaskRun === taskRunName && !queryParamStep;

  const taskDuration = React.useMemo(() => {
    if (!taskRun?.status?.startTime) return null;
    return formatDuration(taskRun.status.startTime, taskRun.status.completionTime);
  }, [taskRun?.status?.startTime, taskRun?.status?.completionTime]);

  const handleTaskClick = React.useCallback(() => {
    onNavigate(taskRunName);
  }, [onNavigate, taskRunName]);

  const hasApprovalTaskPending =
    pipelineRunTaskData?.approvalTask && pipelineRunTaskData?.approvalTask?.spec.action === approvalTaskAction.Pending;

  const hasSteps = taskSteps && taskSteps.length > 0;

  const getStepDuration = (step: Parameters<typeof getTaskRunStepStatus>[0]) => {
    const stepStatus = getTaskRunStepStatus(step);
    if (!stepStatus.startedAt) return null;
    return formatDuration(stepStatus.startedAt, stepStatus.finishedAt || undefined);
  };

  return (
    <div className="mb-1">
      <button
        onClick={handleTaskClick}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg p-3",
          isExpanded && isTaskActive && "bg-primary/10 border-primary/30 border-2",
          isExpanded && !isTaskActive && "bg-muted border-border border-2",
          !isExpanded && "bg-card border-border hover:bg-muted border"
        )}
        style={hasApprovalTaskPending ? { background: approvalTaskBackground } : undefined}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <StatusIcon
            Icon={taskStatusIcon.component}
            color={taskStatusIcon.color}
            isSpinning={taskStatusIcon.isSpinning}
            width={16}
          />
          <span className="text-foreground truncate text-sm">{taskRunName}</span>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          {taskDuration && <span className="text-muted-foreground text-xs">{taskDuration}</span>}
          {hasSteps &&
            (isExpanded ? (
              <ChevronDown className="text-muted-foreground size-4" />
            ) : (
              <ChevronRight className="text-muted-foreground size-4" />
            ))}
        </div>
      </button>

      {isExpanded && hasSteps && (
        <div className="mt-1 ml-4 space-y-1">
          {taskSteps.map((step) => {
            const taskRunStepName = step?.name;
            const stepStatus = getTaskRunStepStatus(step);
            const stepStatusIcon = getStepStatusIcon(step);
            const isStepActive = queryParamStep === taskRunStepName;
            const stepDuration = getStepDuration(step);

            return (
              <button
                key={taskRunStepName}
                onClick={() => onNavigate(taskRunName, taskRunStepName)}
                className={cn(
                  "flex w-full items-center gap-2 rounded p-2 text-left",
                  isStepActive && "bg-primary/10 border-primary/30 border",
                  !isStepActive && "bg-muted/50 border-border hover:bg-muted border"
                )}
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <StatusIcon
                    Icon={stepStatusIcon.component}
                    color={stepStatusIcon.color}
                    isSpinning={stepStatusIcon.isSpinning}
                    Title={`Status: ${stepStatus.status}. Reason: ${stepStatus.reason}`}
                    width={14}
                  />
                  <span className="text-foreground truncate text-xs">{taskRunStepName}</span>
                </div>
                {stepDuration && <span className="text-muted-foreground flex-shrink-0 text-xs">{stepDuration}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
