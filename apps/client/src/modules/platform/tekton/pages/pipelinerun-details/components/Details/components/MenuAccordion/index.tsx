import { StatusIcon } from "@/core/components/StatusIcon";
import { getStepStatusIcon } from "@/k8s/api/groups/Tekton/TaskRun/utils/getStepStatusIcon";
import { router } from "@/core/router";
import { ApprovalTask, approvalTaskAction, getTaskRunStepStatus, Task, TaskRun } from "@my-project/shared";
import React from "react";
import { routePipelineRunDetails, routeSearchTabName, PATH_PIPELINERUN_DETAILS_FULL } from "../../../../route";
import { cn } from "@/core/utils/classname";
import { humanize } from "@/core/utils/date-humanize";
import { approvalTaskBackground, getApprovalTaskOrTaskRunStatusIcon, updateUnexecutedSteps } from "./utils";
import { ChevronDown, ChevronRight } from "lucide-react";

export const MenuAccordion = ({
  taskRunName,
  pipelineRunTasksByNameMap,
}: {
  taskRunName: string;
  pipelineRunTasksByNameMap: Map<
    string,
    {
      approvalTask: ApprovalTask;
      taskRun: TaskRun;
      task: Task;
    }
  >;
}) => {
  const params = routePipelineRunDetails.useParams();
  const queryParams = routePipelineRunDetails.useSearch();
  const queryParamTaskRun = queryParams.taskRun;
  const queryParamStep = queryParams.step;

  const pipelineRunTaskData = pipelineRunTasksByNameMap.get(taskRunName);

  const approvalTask = pipelineRunTaskData?.approvalTask;

  const taskRun = pipelineRunTaskData?.taskRun;
  const task = pipelineRunTaskData?.task;

  const taskStatusIcon = getApprovalTaskOrTaskRunStatusIcon(approvalTask, taskRun);

  const taskSteps = updateUnexecutedSteps(taskRun?.status?.steps ?? task?.spec.steps);
  const isExpanded = queryParamTaskRun === taskRunName;
  const isTaskActive = queryParamTaskRun === taskRunName && !queryParamStep;

  // Calculate task duration
  const taskDuration = React.useMemo(() => {
    if (!taskRun?.status?.startTime) return null;
    const startTime = new Date(taskRun.status.startTime).getTime();
    const endTime = taskRun.status.completionTime ? new Date(taskRun.status.completionTime).getTime() : Date.now();
    return humanize(endTime - startTime, {
      language: "en-mini",
      spacer: "",
      delimiter: " ",
      fallbacks: ["en"],
      largest: 2,
      round: true,
      units: ["d", "h", "m", "s"],
    });
  }, [taskRun?.status?.startTime, taskRun?.status?.completionTime]);

  const handleNavigate = React.useCallback(
    (taskRunName: string, taskRunStepName?: string) => {
      router.navigate({
        to: PATH_PIPELINERUN_DETAILS_FULL,
        params: {
          clusterName: params.clusterName,
          namespace: params.namespace,
          name: params.name,
        },
        search: {
          taskRun: taskRunName,
          step: taskRunStepName,
          tab: routeSearchTabName.details,
        },
        resetScroll: false,
      });
    },
    [params.clusterName, params.name, params.namespace]
  );

  const handleTaskClick = React.useCallback(() => {
    if (isExpanded && !queryParamStep) {
      // If already on task overview, collapse by navigating without taskRun
      // Actually, let's keep it expanded but allow selecting task overview
    }
    handleNavigate(taskRunName);
  }, [isExpanded, queryParamStep, handleNavigate, taskRunName]);

  const hasApprovalTaskPending =
    pipelineRunTaskData?.approvalTask && pipelineRunTaskData?.approvalTask?.spec.action === approvalTaskAction.Pending;

  const hasSteps = taskSteps && taskSteps.length > 0;

  // Calculate step duration
  const getStepDuration = (step: Parameters<typeof getTaskRunStepStatus>[0]) => {
    const stepStatus = getTaskRunStepStatus(step);
    if (!stepStatus.startedAt) return null;
    const startTime = new Date(stepStatus.startedAt).getTime();
    const endTime = stepStatus.finishedAt ? new Date(stepStatus.finishedAt).getTime() : Date.now();
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

  return (
    <div className="mb-1">
      {/* Task header button */}
      <button
        onClick={handleTaskClick}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg p-3 transition-colors",
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

      {/* Steps list */}
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
                onClick={() => handleNavigate(taskRunName, taskRunStepName)}
                className={cn(
                  "flex w-full items-center gap-2 rounded p-2 text-left transition-colors",
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
};
