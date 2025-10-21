import { StatusIcon } from "@/core/components/StatusIcon";
import { getStepStatusIcon } from "@/k8s/api/groups/Tekton/TaskRun/utils/getStepStatusIcon";
import { router } from "@/core/router";
import { Accordion, Stack, Typography, useTheme } from "@mui/material";
import { ApprovalTask, approvalTaskAction, getTaskRunStepStatus, Task, TaskRun } from "@my-project/shared";
import { ChevronDown } from "lucide-react";
import React from "react";
import { routePipelineRunDetails, routeSearchTabName, PATH_PIPELINERUN_DETAILS_FULL } from "../../../../route";
import { StyledAccordionChildBtn, StyledAccordionDetails, StyledAccordionSummary } from "../../../../styles";
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

  const theme = useTheme();

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

  return (
    <Accordion
      key={taskRunName}
      expanded={isExpanded}
      onChange={() => handleAccordionChange(taskRunName)}
      sx={{
        borderLeft: isExpanded ? `2px solid ${theme.palette.primary.main}` : null,
        maxWidth: isExpanded ? "100%" : "90%",

        "&.Mui-expanded": {
          margin: 0,

          "&::before": {
            opacity: 1,
          },
        },
      }}
    >
      <StyledAccordionSummary
        expandIcon={taskSteps?.length ? <ChevronDown size={16} /> : null}
        isActive={isActive}
        disableRipple={false}
        disableTouchRipple={false}
        sx={{
          ...(pipelineRunTaskData?.approvalTask &&
          pipelineRunTaskData?.approvalTask?.spec.action === approvalTaskAction.Pending
            ? { background: approvalTaskBackground }
            : {}),
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <StatusIcon
            Icon={taskStatusIcon.component}
            color={taskStatusIcon.color}
            isSpinning={taskStatusIcon.isSpinning}
            Title={statusTitle}
            width={20}
          />
          <Typography>{taskRunName}</Typography>
        </Stack>
      </StyledAccordionSummary>
      <StyledAccordionDetails>
        <Stack>
          {taskSteps?.map((step) => {
            const taskRunStepName = step?.name;

            const stepStatus = getTaskRunStepStatus(step);
            const stepStatusIcon = getStepStatusIcon(step);

            const isActive = !!queryParamStep && queryParamStep === taskRunStepName;

            return (
              <StyledAccordionChildBtn
                color="inherit"
                onClick={() => handleAccordionChange(taskRunName, taskRunStepName)}
                isActive={isActive}
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  <StatusIcon
                    Icon={stepStatusIcon.component}
                    color={stepStatusIcon.color}
                    isSpinning={stepStatusIcon.isSpinning}
                    Title={`Status: ${stepStatus.status}. Reason: ${stepStatus.reason}`}
                    width={20}
                  />
                  <Typography
                    fontSize={(t) => t.typography.pxToRem(14)}
                    fontWeight={isActive ? 500 : 400}
                    textAlign="left"
                  >
                    {taskRunStepName}
                  </Typography>
                </Stack>
              </StyledAccordionChildBtn>
            );
          })}
        </Stack>
      </StyledAccordionDetails>
    </Accordion>
  );
};
