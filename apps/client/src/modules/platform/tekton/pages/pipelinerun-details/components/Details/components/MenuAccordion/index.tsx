import { StatusIcon } from "@/core/components/StatusIcon";
import { getStepStatusIcon } from "@/k8s/api/groups/Tekton/TaskRun/utils/getStepStatusIcon";
import { approvalTaskAction, getTaskRunStepStatus } from "@my-project/shared";
import { PipelineRunTaskData } from "@/modules/platform/tekton/pages/pipelinerun-details/hooks/types";
import { canHaveSteps } from "@/modules/platform/tekton/pages/pipelinerun-details/hooks/utils";
import {
  usePipelineTaskSpec,
  usePrefetchPipelineTaskSpec,
} from "@/modules/platform/tekton/pages/pipelinerun-details/hooks/usePipelineTaskSpec";
import React from "react";
import { cn } from "@/core/utils/classname";
import { formatDuration } from "@/core/utils/date-humanize";
import { approvalTaskBackground, updateUnexecutedSteps } from "./utils";
import { getPipelineTaskStatusDisplay } from "@/modules/platform/tekton/utils/getPipelineTaskStatusDisplay";
import { ChevronDown, ChevronRight } from "lucide-react";

export interface MenuAccordionBaseProps {
  taskRunName: string;
  pipelineRunTasksByNameMap: Map<string, PipelineRunTaskData>;
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

  const taskRun = pipelineRunTaskData?.taskRun;

  const taskStatusDisplay = getPipelineTaskStatusDisplay(pipelineRunTaskData ?? {});

  const isExpanded = queryParamTaskRun === taskRunName;
  const isTaskActive = queryParamTaskRun === taskRunName && !queryParamStep;

  const taskDuration = React.useMemo(() => {
    if (!taskRun?.status?.startTime) return null;
    return formatDuration(taskRun.status.startTime, taskRun.status.completionTime);
  }, [taskRun?.status?.startTime, taskRun?.status?.completionTime]);

  const handleTaskClick = React.useCallback(() => {
    onNavigate(taskRunName);
  }, [onNavigate, taskRunName]);

  const prefetchTaskSpec = usePrefetchPipelineTaskSpec();
  const handlePrefetchTaskSpec = React.useCallback(() => {
    prefetchTaskSpec(pipelineRunTaskData);
  }, [prefetchTaskSpec, pipelineRunTaskData]);

  const hasApprovalTaskPending =
    pipelineRunTaskData?.approvalTask && pipelineRunTaskData?.approvalTask?.spec.action === approvalTaskAction.Pending;

  const hasSteps = !!pipelineRunTaskData && canHaveSteps(pipelineRunTaskData);

  return (
    <div className="mb-1">
      <button
        onClick={handleTaskClick}
        onPointerEnter={handlePrefetchTaskSpec}
        onFocus={handlePrefetchTaskSpec}
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
            Icon={taskStatusDisplay.component}
            color={taskStatusDisplay.color}
            isSpinning={taskStatusDisplay.isSpinning}
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

      {isExpanded && hasSteps && pipelineRunTaskData && (
        <MenuAccordionSteps
          pipelineRunTaskData={pipelineRunTaskData}
          taskRunName={taskRunName}
          queryParamStep={queryParamStep}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
}

interface MenuAccordionStepsProps {
  pipelineRunTaskData: PipelineRunTaskData;
  taskRunName: string;
  queryParamStep: string | undefined;
  onNavigate: (taskRunName: string, taskRunStepName?: string) => void;
}

/** Mounted only for the expanded task. A pending task reads its Task on mount. */
function MenuAccordionSteps({ pipelineRunTaskData, taskRunName, queryParamStep, onNavigate }: MenuAccordionStepsProps) {
  const { taskSpec, isLoading, isUnavailable } = usePipelineTaskSpec(pipelineRunTaskData);

  const taskSteps = updateUnexecutedSteps(pipelineRunTaskData.taskRun?.status?.steps ?? taskSpec?.steps);

  const getStepDuration = (step: Parameters<typeof getTaskRunStepStatus>[0]) => {
    const stepStatus = getTaskRunStepStatus(step);
    if (!stepStatus.startedAt) return null;
    return formatDuration(stepStatus.startedAt, stepStatus.finishedAt || undefined);
  };

  if (taskSteps.length === 0) {
    if (!isLoading && !isUnavailable) return null;

    return (
      <p role="status" className="text-muted-foreground mt-1 ml-4 p-2 text-xs">
        {isLoading ? "Loading steps…" : "No step preview available"}
      </p>
    );
  }

  return (
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
  );
}
