import { StatusIcon } from "@/core/components/StatusIcon";
import { getStepStatusIcon } from "@/k8s/api/groups/Tekton/TaskRun/utils/getStepStatusIcon";
import { router } from "@/core/router";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/core/components/ui/accordion";
import { ApprovalTask, approvalTaskAction, getTaskRunStepStatus, Task, TaskRun } from "@my-project/shared";
import React from "react";
import { routePipelineRunDetails, routeSearchTabName, PATH_PIPELINERUN_DETAILS_FULL } from "../../../../route";
import { Button } from "@/core/components/ui/button";
import { cn } from "@/core/utils/classname";
import {
  approvalTaskBackground,
  getApprovalTaskOrTaskRunStatusIcon,
  getApprovalTaskOrTaskRunStatusTitle,
  updateUnexecutedSteps,
} from "./utils";

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
  const statusTitle = getApprovalTaskOrTaskRunStatusTitle(approvalTask, taskRun);

  const taskSteps = updateUnexecutedSteps(taskRun?.status?.steps ?? task?.spec.steps);
  const isExpanded = queryParamTaskRun === taskRunName;
  const isActive = queryParamTaskRun === taskRunName && !queryParamStep;

  const handleAccordionChange = React.useCallback(
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
      });
    },
    [params.clusterName, params.name, params.namespace]
  );

  const hasApprovalTaskPending =
    pipelineRunTaskData?.approvalTask &&
    pipelineRunTaskData?.approvalTask?.spec.action === approvalTaskAction.Pending;

  return (
    <Accordion
      key={taskRunName}
      type="single"
      collapsible
      value={isExpanded ? taskRunName : undefined}
      onValueChange={(value) => {
        if (value === taskRunName) {
          handleAccordionChange(taskRunName);
        } else {
          handleAccordionChange(taskRunName);
        }
      }}
    >
      <AccordionItem
        value={taskRunName}
        className={cn(
          "border-0",
          isExpanded && "border-l-2 border-l-primary",
          !isExpanded && "max-w-[90%]"
        )}
      >
        <AccordionTrigger
          className={cn(
            "min-h-0 transition-colors [&>svg]:h-4 [&>svg]:w-4",
            isActive && "bg-accent font-medium",
            !isActive && "font-normal",
            !taskSteps?.length && "[&>svg]:hidden"
          )}
          style={hasApprovalTaskPending ? { background: approvalTaskBackground } : undefined}
        >
          <div className="flex items-center gap-2">
            <StatusIcon
              Icon={taskStatusIcon.component}
              color={taskStatusIcon.color}
              isSpinning={taskStatusIcon.isSpinning}
              Title={statusTitle}
              width={20}
            />
            <span>{taskRunName}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="p-0">
          <div className="flex flex-col">
            {taskSteps?.map((step) => {
              const taskRunStepName = step?.name;

              const stepStatus = getTaskRunStepStatus(step);
              const stepStatusIcon = getStepStatusIcon(step);

              const isActive = !!queryParamStep && queryParamStep === taskRunStepName;

              return (
                <Button
                  variant="ghost"
                  className={`w-full justify-start px-4 py-2.5 text-left normal-case ${
                    isActive ? "bg-accent font-medium" : "font-normal"
                  }`}
                  onClick={() => handleAccordionChange(taskRunName, taskRunStepName)}
                >
                  <div className="flex items-center gap-2">
                    <StatusIcon
                      Icon={stepStatusIcon.component}
                      color={stepStatusIcon.color}
                      isSpinning={stepStatusIcon.isSpinning}
                      Title={`Status: ${stepStatus.status}. Reason: ${stepStatus.reason}`}
                      width={20}
                    />
                    <span className={`text-sm ${isActive ? "font-medium" : "font-normal"} text-left`}>
                      {taskRunStepName}
                    </span>
                  </div>
                </Button>
              );
            })}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
